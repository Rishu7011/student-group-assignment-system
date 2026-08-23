import { Request, Response } from 'express';
import pool from '../config/db';

async function assertGroupMember(userId: number, groupId: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return result.rows.length > 0;
}

// POST /api/submissions/:assignmentId/step1
export async function stepOne(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.assignmentId, 10);
  const { group_id, file_url } = req.body as { group_id?: number; file_url?: string };

  if (!group_id) { res.status(400).json({ error: 'group_id is required' }); return; }

  try {
    const isMember = await assertGroupMember(req.user!.id, group_id);
    if (!isMember) { res.status(403).json({ error: 'You are not a member of this group' }); return; }

    const assignmentCheck = await pool.query(`SELECT id FROM assignments WHERE id = $1`, [assignmentId]);
    if (assignmentCheck.rows.length === 0) { res.status(404).json({ error: 'Assignment not found' }); return; }

    const result = await pool.query(
      `INSERT INTO submissions (assignment_id, group_id, status, file_url, review_status)
       VALUES ($1, $2, 'pending_confirmation', $3, 'pending')
       ON CONFLICT (assignment_id, group_id)
       DO UPDATE SET status = 'pending_confirmation',
                     review_status = 'pending',
                     file_url = COALESCE($3, submissions.file_url)
       WHERE submissions.status = 'pending' OR submissions.status = 'pending_confirmation'
       RETURNING *`,
      [assignmentId, group_id, file_url ?? null]
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        `SELECT status, file_url, review_status FROM submissions WHERE assignment_id = $1 AND group_id = $2`,
        [assignmentId, group_id]
      );
      const row = existing.rows[0];
      if (row?.status === 'confirmed') {
        if (row.review_status === 'rejected') {
          // Allow resubmission when rejected
          const resetResult = await pool.query(
            `UPDATE submissions
             SET status = 'pending_confirmation', review_status = 'pending', review_feedback = null,
                 file_url = COALESCE($3, submissions.file_url)
             WHERE assignment_id = $1 AND group_id = $2
             RETURNING *`,
            [assignmentId, group_id, file_url ?? null]
          );
          res.status(200).json({ message: 'Resubmission started. Proceed to step 2.', submission: resetResult.rows[0] });
          return;
        }
        res.status(409).json({ error: 'Submission is already confirmed' });
        return;
      }
      res.status(200).json({ message: 'Step 1 already completed. Proceed to step 2.', submission: existing.rows[0] });
      return;
    }

    res.status(200).json({ message: 'Step 1 complete. Call step 2 to confirm.', submission: result.rows[0] });
  } catch (err) {
    console.error('stepOne error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/submissions/:assignmentId/step2
export async function stepTwo(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.assignmentId, 10);
  const { group_id, file_url } = req.body as { group_id?: number; file_url?: string };

  if (!group_id) { res.status(400).json({ error: 'group_id is required' }); return; }

  try {
    const isMember = await assertGroupMember(req.user!.id, group_id);
    if (!isMember) { res.status(403).json({ error: 'You are not a member of this group' }); return; }

    const result = await pool.query(
      `UPDATE submissions
       SET status = 'confirmed', confirmed_by = $1, confirmed_at = now(),
           file_url = COALESCE($4, file_url),
           review_status = 'pending'
       WHERE assignment_id = $2 AND group_id = $3 AND status = 'pending_confirmation'
       RETURNING *`,
      [req.user!.id, assignmentId, group_id, file_url ?? null]
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        `SELECT status, file_url FROM submissions WHERE assignment_id = $1 AND group_id = $2`,
        [assignmentId, group_id]
      );
      if (existing.rows.length === 0 || existing.rows[0].status === 'pending') {
        res.status(400).json({ error: 'Step 1 not completed yet. Call step 1 first.' }); return;
      }
      if (existing.rows[0].status === 'confirmed') {
        res.status(409).json({ error: 'Submission is already confirmed' }); return;
      }
    }

    res.status(200).json({ message: 'Submission confirmed successfully.', submission: result.rows[0] });
  } catch (err) {
    console.error('stepTwo error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PATCH /api/submissions/:assignmentId/groups/:groupId/review (admin)
export async function reviewSubmission(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.assignmentId, 10);
  const groupId = parseInt(req.params.groupId, 10);
  const { review_status, review_feedback } = req.body as {
    review_status?: 'accepted' | 'rejected';
    review_feedback?: string;
  };

  if (!review_status || !['accepted', 'rejected'].includes(review_status)) {
    res.status(400).json({ error: "review_status must be 'accepted' or 'rejected'" });
    return;
  }

  try {
    const existing = await pool.query(
      `SELECT status FROM submissions WHERE assignment_id = $1 AND group_id = $2`,
      [assignmentId, groupId]
    );

    if (existing.rows.length === 0 || existing.rows[0].status !== 'confirmed') {
      res.status(400).json({ error: 'Cannot review a submission that is not confirmed yet' });
      return;
    }

    const result = await pool.query(
      `UPDATE submissions
       SET review_status = $1, review_feedback = $2, reviewed_at = now(), reviewed_by = $3
       WHERE assignment_id = $4 AND group_id = $5
       RETURNING *`,
      [review_status, review_feedback ?? null, req.user!.id, assignmentId, groupId]
    );

    res.status(200).json({
      message: `Submission ${review_status === 'accepted' ? 'accepted and marked as Done' : 'rejected'} successfully`,
      submission: result.rows[0],
    });
  } catch (err) {
    console.error('reviewSubmission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/submissions/assignment/:id (admin)
export async function getStatusForAssignment(req: Request, res: Response): Promise<void> {
  const assignmentId = parseInt(req.params.id, 10);
  try {
    const result = await pool.query(
      `SELECT g.id AS group_id, g.name AS group_name,
              s.status, s.confirmed_at, s.file_url,
              COALESCE(s.review_status, 'pending') AS review_status,
              s.review_feedback, s.reviewed_at,
              u.name AS confirmed_by_name,
              u_rev.name AS reviewed_by_name,
              (SELECT json_agg(json_build_object('id', u2.id, 'name', u2.name, 'email', u2.email))
               FROM group_members gm2 JOIN users u2 ON u2.id = gm2.user_id
               WHERE gm2.group_id = g.id) AS members
       FROM assignments a
       LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id
       JOIN groups g ON (a.assigned_to_type = 'all') OR (ag.group_id = g.id)
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = g.id
       LEFT JOIN users u ON u.id = s.confirmed_by
       LEFT JOIN users u_rev ON u_rev.id = s.reviewed_by
       WHERE a.id = $1 ORDER BY g.name`,
      [assignmentId]
    );
    res.status(200).json({ assignment_id: assignmentId, groups: result.rows });
  } catch (err) {
    console.error('getStatusForAssignment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/submissions/group/:id (student own group or admin)
export async function getStatusForGroup(req: Request, res: Response): Promise<void> {
  const groupId = parseInt(req.params.id, 10);
  try {
    if (req.user!.role === 'student') {
      const isMember = await assertGroupMember(req.user!.id, groupId);
      if (!isMember) { res.status(403).json({ error: 'Access denied: not a member of this group' }); return; }
    }

    const result = await pool.query(
      `SELECT a.id AS assignment_id, a.title, a.due_date,
              COALESCE(s.status, 'pending') AS status,
              s.confirmed_at, s.file_url,
              COALESCE(s.review_status, 'pending') AS review_status,
              s.review_feedback, s.reviewed_at,
              u.name AS confirmed_by_name,
              u_rev.name AS reviewed_by_name
       FROM assignments a
       LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id AND ag.group_id = $1
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
       LEFT JOIN users u ON u.id = s.confirmed_by
       LEFT JOIN users u_rev ON u_rev.id = s.reviewed_by
       WHERE a.assigned_to_type = 'all' OR ag.group_id = $1
       ORDER BY a.due_date ASC`,
      [groupId]
    );
    res.status(200).json({ group_id: groupId, assignments: result.rows });
  } catch (err) {
    console.error('getStatusForGroup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
