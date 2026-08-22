const pool = require('../config/db');

// Helper: verify caller is a member of the given group
async function assertGroupMember(userId, groupId) {
  const result = await pool.query(
    `SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return result.rows.length > 0;
}

// ---------------------------------------------------------------------------
// POST /api/submissions/:assignmentId/step1
// "Yes, I have submitted" — creates/updates row to pending_confirmation
// Student-only; caller must belong to the group param in body
// ---------------------------------------------------------------------------
async function stepOne(req, res) {
  const assignmentId = parseInt(req.params.assignmentId, 10);
  const { group_id } = req.body;

  if (!group_id) {
    return res.status(400).json({ error: 'group_id is required' });
  }

  try {
    // Verify group membership
    const isMember = await assertGroupMember(req.user.id, group_id);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Verify assignment exists
    const assignmentCheck = await pool.query(
      `SELECT id FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Upsert submission row to pending_confirmation
    const result = await pool.query(
      `INSERT INTO submissions (assignment_id, group_id, status)
       VALUES ($1, $2, 'pending_confirmation')
       ON CONFLICT (assignment_id, group_id)
       DO UPDATE SET status = 'pending_confirmation'
       WHERE submissions.status = 'pending'
       RETURNING *`,
      [assignmentId, group_id]
    );

    if (result.rows.length === 0) {
      // Conflict but status wasn't 'pending' — either already confirmed or already at step 1
      const existing = await pool.query(
        `SELECT status FROM submissions WHERE assignment_id = $1 AND group_id = $2`,
        [assignmentId, group_id]
      );
      const status = existing.rows[0]?.status;
      if (status === 'confirmed') {
        return res.status(409).json({ error: 'Submission is already confirmed' });
      }
      // Already at pending_confirmation — idempotent, return OK
      return res.status(200).json({
        message: 'Step 1 already completed. Proceed to step 2 to confirm.',
        submission: existing.rows[0],
      });
    }

    return res.status(200).json({
      message: 'Step 1 complete — submission registered. Call step 2 to confirm.',
      submission: result.rows[0],
    });
  } catch (err) {
    console.error('stepOne error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/submissions/:assignmentId/step2
// Final confirmation — sets status to 'confirmed'
// Requires step1 to have been done first (status must be pending_confirmation)
// ---------------------------------------------------------------------------
async function stepTwo(req, res) {
  const assignmentId = parseInt(req.params.assignmentId, 10);
  const { group_id } = req.body;

  if (!group_id) {
    return res.status(400).json({ error: 'group_id is required' });
  }

  try {
    // Verify group membership
    const isMember = await assertGroupMember(req.user.id, group_id);
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Only allow step 2 if step 1 was done (status = pending_confirmation)
    const result = await pool.query(
      `UPDATE submissions
       SET status       = 'confirmed',
           confirmed_by = $1,
           confirmed_at = now()
       WHERE assignment_id = $2
         AND group_id      = $3
         AND status        = 'pending_confirmation'
       RETURNING *`,
      [req.user.id, assignmentId, group_id]
    );

    if (result.rows.length === 0) {
      // Check why — does the row exist?
      const existing = await pool.query(
        `SELECT status FROM submissions WHERE assignment_id = $1 AND group_id = $2`,
        [assignmentId, group_id]
      );
      if (existing.rows.length === 0) {
        return res.status(400).json({
          error: 'Step 1 not completed yet. Call step 1 first before confirming.',
        });
      }
      const status = existing.rows[0].status;
      if (status === 'confirmed') {
        return res.status(409).json({ error: 'Submission is already confirmed' });
      }
      if (status === 'pending') {
        return res.status(400).json({
          error: 'Step 1 not completed yet. Call step 1 first before confirming.',
        });
      }
    }

    return res.status(200).json({
      message: 'Submission confirmed successfully.',
      submission: result.rows[0],
    });
  } catch (err) {
    console.error('stepTwo error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/submissions/assignment/:id
// Admin-only: all groups' submission status for a given assignment
// ---------------------------------------------------------------------------
async function getStatusForAssignment(req, res) {
  const assignmentId = parseInt(req.params.id, 10);

  try {
    // Get all groups relevant to this assignment
    const result = await pool.query(
      `SELECT
         g.id          AS group_id,
         g.name        AS group_name,
         s.status,
         s.confirmed_at,
         u.name        AS confirmed_by_name,
         (
           SELECT json_agg(json_build_object('id', u2.id, 'name', u2.name, 'email', u2.email))
           FROM group_members gm2
           JOIN users u2 ON u2.id = gm2.user_id
           WHERE gm2.group_id = g.id
         )             AS members
       FROM assignments a
       LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id
       JOIN groups g
         ON (a.assigned_to_type = 'all') OR (ag.group_id = g.id)
       LEFT JOIN submissions s
         ON s.assignment_id = a.id AND s.group_id = g.id
       LEFT JOIN users u ON u.id = s.confirmed_by
       WHERE a.id = $1
       ORDER BY g.name`,
      [assignmentId]
    );

    return res.status(200).json({ assignment_id: assignmentId, groups: result.rows });
  } catch (err) {
    console.error('getStatusForAssignment error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/submissions/group/:id
// Student (own group) or admin: group's submission status across all assignments
// ---------------------------------------------------------------------------
async function getStatusForGroup(req, res) {
  const groupId = parseInt(req.params.id, 10);

  try {
    // Students can only view their own group
    if (req.user.role === 'student') {
      const isMember = await assertGroupMember(req.user.id, groupId);
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied: not a member of this group' });
      }
    }

    const result = await pool.query(
      `SELECT
         a.id          AS assignment_id,
         a.title,
         a.due_date,
         COALESCE(s.status, 'pending') AS status,
         s.confirmed_at,
         u.name        AS confirmed_by_name
       FROM assignments a
       LEFT JOIN assignment_groups ag ON ag.assignment_id = a.id AND ag.group_id = $1
       LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = $1
       LEFT JOIN users u ON u.id = s.confirmed_by
       WHERE a.assigned_to_type = 'all'
          OR ag.group_id = $1
       ORDER BY a.due_date ASC`,
      [groupId]
    );

    return res.status(200).json({ group_id: groupId, assignments: result.rows });
  } catch (err) {
    console.error('getStatusForGroup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { stepOne, stepTwo, getStatusForAssignment, getStatusForGroup };
