import { Request, Response } from 'express';
import pool from '../config/db';

const URL_REGEX = /^https?:\/\/.+/i;

// POST /api/assignments  (admin)
export async function createAssignment(req: Request, res: Response): Promise<void> {
  const { title, description, due_date, onedrive_link, assigned_to_type, group_ids } =
    req.body as {
      title?: string; description?: string; due_date?: string;
      onedrive_link?: string; assigned_to_type?: string; group_ids?: number[];
    };

  if (!title || !due_date || !onedrive_link || !assigned_to_type) {
    res.status(400).json({ error: 'title, due_date, onedrive_link, and assigned_to_type are required' });
    return;
  }
  if (!['all', 'group'].includes(assigned_to_type)) {
    res.status(400).json({ error: "assigned_to_type must be 'all' or 'group'" }); return;
  }
  if (!URL_REGEX.test(onedrive_link)) {
    res.status(400).json({ error: 'onedrive_link must be a valid URL (http/https)' }); return;
  }
  if (isNaN(Date.parse(due_date))) {
    res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' }); return;
  }
  if (assigned_to_type === 'group' && (!Array.isArray(group_ids) || group_ids.length === 0)) {
    res.status(400).json({ error: "group_ids (array) is required when assigned_to_type is 'group'" }); return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const assignResult = await client.query(
      `INSERT INTO assignments (title, description, due_date, onedrive_link, created_by, assigned_to_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description ?? null, due_date, onedrive_link, req.user!.id, assigned_to_type]
    );
    const assignment = assignResult.rows[0];

    if (assigned_to_type === 'group' && group_ids) {
      for (const gid of group_ids) {
        await client.query(
          `INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [assignment.id, gid]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ assignment });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createAssignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// PUT /api/assignments/:id  (admin, creator only)
export async function updateAssignment(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id, 10);
  const { title, description, due_date, onedrive_link, assigned_to_type, group_ids } = req.body;

  try {
    const existing = await pool.query(`SELECT * FROM assignments WHERE id = $1`, [assignmentId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Assignment not found' }); return; }
    if (existing.rows[0].created_by !== req.user!.id) {
      res.status(403).json({ error: 'You can only edit your own assignments' }); return;
    }
    if (onedrive_link && !URL_REGEX.test(onedrive_link)) {
      res.status(400).json({ error: 'onedrive_link must be a valid URL' }); return;
    }
    if (due_date && isNaN(Date.parse(due_date))) {
      res.status(400).json({ error: 'due_date must be a valid date' }); return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `UPDATE assignments
         SET title = COALESCE($1, title), description = COALESCE($2, description),
             due_date = COALESCE($3, due_date), onedrive_link = COALESCE($4, onedrive_link),
             assigned_to_type = COALESCE($5, assigned_to_type)
         WHERE id = $6 RETURNING *`,
        [title, description, due_date, onedrive_link, assigned_to_type, assignmentId]
      );

      if (assigned_to_type || group_ids) {
        await client.query(`DELETE FROM assignment_groups WHERE assignment_id = $1`, [assignmentId]);
        if (updated.rows[0].assigned_to_type === 'group' && Array.isArray(group_ids)) {
          for (const gid of group_ids) {
            await client.query(
              `INSERT INTO assignment_groups (assignment_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [assignmentId, gid]
            );
          }
        }
      }
      await client.query('COMMIT');
      res.status(200).json({ assignment: updated.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('updateAssignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/assignments/:id  (admin, creator only)
export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id, 10);
  if (isNaN(assignmentId)) {
    res.status(400).json({ error: 'Invalid assignment ID' }); return;
  }

  const client = await pool.connect();
  try {
    const existing = await client.query(`SELECT * FROM assignments WHERE id = $1`, [assignmentId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Assignment not found' }); return;
    }
    if (existing.rows[0].created_by !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete your own assignments' }); return;
    }

    await client.query('BEGIN');
    // Remove linked groups first (in case FK is not CASCADE)
    await client.query(`DELETE FROM assignment_groups WHERE assignment_id = $1`, [assignmentId]);
    // Remove submissions linked to this assignment
    await client.query(`DELETE FROM submissions WHERE assignment_id = $1`, [assignmentId]);
    // Delete the assignment itself
    await client.query(`DELETE FROM assignments WHERE id = $1`, [assignmentId]);
    await client.query('COMMIT');

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('deleteAssignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

// GET /api/assignments  (role-aware)
export async function listAssignments(req: Request, res: Response): Promise<void> {
  try {
    let query: string, params: unknown[];

    if (req.user!.role === 'admin') {
      query = `SELECT a.*, u.name AS creator_name FROM assignments a
               JOIN users u ON u.id = a.created_by
               WHERE a.created_by = $1 ORDER BY a.created_at DESC`;
      params = [req.user!.id];
    } else {
      query = `SELECT DISTINCT a.*, u.name AS creator_name FROM assignments a
               JOIN users u ON u.id = a.created_by
               LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id
               LEFT JOIN group_members gm ON gm.group_id = ag.group_id AND gm.user_id = $1
               WHERE a.assigned_to_type = 'all' OR gm.user_id = $1
               ORDER BY a.created_at DESC`;
      params = [req.user!.id];
    }

    const result = await pool.query(query, params);
    res.status(200).json({ assignments: result.rows });
  } catch (err) {
    console.error('listAssignments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/assignments/:id
export async function getAssignmentById(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id, 10);

  try {
    const result = await pool.query(
      `SELECT a.*, u.name AS creator_name FROM assignments a
       JOIN users u ON u.id = a.created_by WHERE a.id = $1`,
      [assignmentId]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Assignment not found' }); return; }

    const assignment = result.rows[0];
    if (req.user!.role === 'student' && assignment.assigned_to_type !== 'all') {
      const access = await pool.query(
        `SELECT ag.id FROM assignment_groups ag
         JOIN group_members gm ON gm.group_id = ag.group_id
         WHERE ag.assignment_id = $1 AND gm.user_id = $2`,
        [assignmentId, req.user!.id]
      );
      if (access.rows.length === 0) {
        res.status(403).json({ error: 'Access denied: assignment not targeted at your group' }); return;
      }
    }

    if (assignment.assigned_to_type === 'group') {
      const groups = await pool.query(
        `SELECT g.id, g.name FROM assignment_groups ag
         JOIN groups g ON g.id = ag.group_id WHERE ag.assignment_id = $1`,
        [assignmentId]
      );
      assignment.targeted_groups = groups.rows;
    }

    res.status(200).json({ assignment });
  } catch (err) {
    console.error('getAssignmentById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
