const pool = require('../config/db');

// Simple URL regex (no overengineering)
const URL_REGEX = /^https?:\/\/.+/i;

// ---------------------------------------------------------------------------
// POST /api/assignments  (admin-only)
// ---------------------------------------------------------------------------
async function createAssignment(req, res) {
  const { title, description, due_date, onedrive_link, assigned_to_type, group_ids } = req.body;

  if (!title || !due_date || !onedrive_link || !assigned_to_type) {
    return res.status(400).json({
      error: 'title, due_date, onedrive_link, and assigned_to_type are required',
    });
  }

  if (!['all', 'group'].includes(assigned_to_type)) {
    return res.status(400).json({ error: "assigned_to_type must be 'all' or 'group'" });
  }

  if (!URL_REGEX.test(onedrive_link)) {
    return res.status(400).json({ error: 'onedrive_link must be a valid URL (http/https)' });
  }

  if (isNaN(Date.parse(due_date))) {
    return res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
  }

  if (assigned_to_type === 'group' && (!Array.isArray(group_ids) || group_ids.length === 0)) {
    return res.status(400).json({
      error: "group_ids (array) is required when assigned_to_type is 'group'",
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const assignResult = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, assigned_to_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, description || null, due_date, onedrive_link, req.user.id, assigned_to_type]
    );
    const assignment = assignResult.rows[0];

    if (assigned_to_type === 'group') {
      for (const gid of group_ids) {
        await client.query(
          `INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [assignment.id, gid]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ assignment });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createAssignment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// PUT /api/assignments/:id  (admin-only, must be creator)
// ---------------------------------------------------------------------------
async function updateAssignment(req, res) {
  const assignmentId = parseInt(req.params.id, 10);
  const { title, description, due_date, onedrive_link, assigned_to_type, group_ids } = req.body;

  try {
    const existing = await pool.query(
      `SELECT * FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (existing.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own assignments' });
    }

    // Validate optional fields if provided
    if (onedrive_link && !URL_REGEX.test(onedrive_link)) {
      return res.status(400).json({ error: 'onedrive_link must be a valid URL (http/https)' });
    }
    if (due_date && isNaN(Date.parse(due_date))) {
      return res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
    }
    if (assigned_to_type && !['all', 'group'].includes(assigned_to_type)) {
      return res.status(400).json({ error: "assigned_to_type must be 'all' or 'group'" });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const updated = await client.query(
        `UPDATE assignments
         SET title            = COALESCE($1, title),
             description      = COALESCE($2, description),
             due_date         = COALESCE($3, due_date),
             onedrive_link    = COALESCE($4, onedrive_link),
             assigned_to_type = COALESCE($5, assigned_to_type)
         WHERE id = $6
         RETURNING *`,
        [title, description, due_date, onedrive_link, assigned_to_type, assignmentId]
      );

      // Refresh assignment_groups if type or groups changed
      const newType = updated.rows[0].assigned_to_type;
      if (assigned_to_type || group_ids) {
        await client.query(`DELETE FROM assignment_groups WHERE assignment_id = $1`, [assignmentId]);
        if (newType === 'group' && Array.isArray(group_ids) && group_ids.length > 0) {
          for (const gid of group_ids) {
            await client.query(
              `INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [assignmentId, gid]
            );
          }
        }
      }

      await client.query('COMMIT');
      return res.status(200).json({ assignment: updated.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('updateAssignment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/assignments  (role-aware)
// Admin: sees all assignments they created
// Student: sees 'all' assignments + ones targeting their groups
// ---------------------------------------------------------------------------
async function listAssignments(req, res) {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT a.*, u.name AS creator_name
        FROM assignments a
        JOIN users u ON u.id = a.created_by
        WHERE a.created_by = $1
        ORDER BY a.created_at DESC`;
      params = [req.user.id];
    } else {
      // Student: 'all' assignments + targeted to their groups
      query = `
        SELECT DISTINCT a.*, u.name AS creator_name
        FROM assignments a
        JOIN users u ON u.id = a.created_by
        LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id
        LEFT JOIN group_members gm ON gm.group_id = ag.group_id AND gm.user_id = $1
        WHERE a.assigned_to_type = 'all'
           OR gm.user_id = $1
        ORDER BY a.created_at DESC`;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ assignments: result.rows });
  } catch (err) {
    console.error('listAssignments error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/assignments/:id
// Same access rules as listAssignments
// ---------------------------------------------------------------------------
async function getAssignmentById(req, res) {
  const assignmentId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS creator_name
       FROM assignments a
       JOIN users u ON u.id = a.created_by
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = result.rows[0];

    // Access check for students
    if (req.user.role === 'student') {
      if (assignment.assigned_to_type !== 'all') {
        const access = await pool.query(
          `SELECT ag.id
           FROM assignment_groups ag
           JOIN group_members gm ON gm.group_id = ag.group_id
           WHERE ag.assignment_id = $1 AND gm.user_id = $2`,
          [assignmentId, req.user.id]
        );
        if (access.rows.length === 0) {
          return res.status(403).json({ error: 'Access denied: assignment not targeted at your group' });
        }
      }
    }

    // Attach targeted group list if type = 'group'
    if (assignment.assigned_to_type === 'group') {
      const groups = await pool.query(
        `SELECT g.id, g.name
         FROM assignment_groups ag
         JOIN groups g ON g.id = ag.group_id
         WHERE ag.assignment_id = $1`,
        [assignmentId]
      );
      assignment.targeted_groups = groups.rows;
    }

    return res.status(200).json({ assignment });
  } catch (err) {
    console.error('getAssignmentById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createAssignment, updateAssignment, listAssignments, getAssignmentById };
