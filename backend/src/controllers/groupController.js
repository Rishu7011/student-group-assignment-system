const pool = require('../config/db');

// ---------------------------------------------------------------------------
// POST /api/groups
// Student-only: create a group, auto-add creator as member
// ---------------------------------------------------------------------------
async function createGroup(req, res) {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *`,
      [name.trim(), req.user.id]
    );
    const group = groupResult.rows[0];

    // Auto-add creator as a member
    await client.query(
      `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
      [group.id, req.user.id]
    );

    await client.query('COMMIT');
    return res.status(201).json({ group });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createGroup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// POST /api/groups/:id/members
// Student-only: add a member by email; caller must already be in the group
// ---------------------------------------------------------------------------
async function addMember(req, res) {
  const groupId = parseInt(req.params.id, 10);
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    // Check caller is a member of the group
    const memberCheck = await pool.query(
      `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, req.user.id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Find the user by email
    const userResult = await pool.query(
      `SELECT id, name, email, role FROM users WHERE email = $1`,
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' });
    }
    const targetUser = userResult.rows[0];

    // Insert into group_members (UNIQUE constraint handles duplicates)
    try {
      await pool.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
        [groupId, targetUser.id]
      );
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'User is already a member of this group' });
      }
      throw insertErr;
    }

    return res.status(201).json({
      message: `${targetUser.name} added to group`,
      user: targetUser,
    });
  } catch (err) {
    console.error('addMember error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/mine
// Returns all groups the logged-in student belongs to, with member lists
// ---------------------------------------------------------------------------
async function getMyGroups(req, res) {
  try {
    const groupsResult = await pool.query(
      `SELECT g.id, g.name, g.created_by, g.created_at
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );

    const groups = await Promise.all(
      groupsResult.rows.map(async (group) => {
        const membersResult = await pool.query(
          `SELECT u.id, u.name, u.email, u.role, gm.joined_at
           FROM group_members gm
           JOIN users u ON u.id = gm.user_id
           WHERE gm.group_id = $1`,
          [group.id]
        );
        return { ...group, members: membersResult.rows };
      })
    );

    return res.status(200).json({ groups });
  } catch (err) {
    console.error('getMyGroups error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/all
// Admin-only: returns all groups with member counts (used for assignment targeting)
// ---------------------------------------------------------------------------
async function getAllGroups(req, res) {
  try {
    const result = await pool.query(
      `SELECT g.id, g.name, g.created_by, g.created_at,
              COUNT(gm.user_id)::int AS member_count
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );
    return res.status(200).json({ groups: result.rows });
  } catch (err) {
    console.error('getAllGroups error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/groups/:id
// Group detail + members + progress (caller must be a member, or admin)
// ---------------------------------------------------------------------------
async function getGroupById(req, res) {
  const groupId = parseInt(req.params.id, 10);

  try {
    // Authorization: must be a member of the group OR an admin
    if (req.user.role !== 'admin') {
      const memberCheck = await pool.query(
        `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied: you are not a member of this group' });
      }
    }

    const groupResult = await pool.query(
      `SELECT id, name, created_by, created_at FROM groups WHERE id = $1`,
      [groupId]
    );
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    const group = groupResult.rows[0];

    // Members
    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [groupId]
    );

    // Progress: confirmed submissions / total assignments assigned to this group
    const progressResult = await pool.query(
      `SELECT
         COUNT(DISTINCT a.id)::int                                          AS total_assignments,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'confirmed')::int   AS confirmed_count
       FROM assignments a
       LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
       WHERE a.assigned_to_type = 'all'
          OR ag.group_id = $1`,
      [groupId]
    );

    const { total_assignments, confirmed_count } = progressResult.rows[0];
    const completion_rate =
      total_assignments > 0
        ? Math.round((confirmed_count / total_assignments) * 100)
        : 0;

    return res.status(200).json({
      group: {
        ...group,
        members: membersResult.rows,
        progress: { total_assignments, confirmed_count, completion_rate },
      },
    });
  } catch (err) {
    console.error('getGroupById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createGroup, addMember, getMyGroups, getAllGroups, getGroupById };
