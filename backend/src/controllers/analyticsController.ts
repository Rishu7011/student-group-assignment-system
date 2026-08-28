import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/analytics/overview  (admin)
export async function overview(_req: Request, res: Response): Promise<void> {
  try {
    const totalsResult = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM assignments)                            AS "totalAssignments",
        (SELECT COUNT(*)::int FROM groups)                                 AS "totalGroups",
        (SELECT COUNT(*)::int FROM users WHERE role = 'student')          AS "totalStudents",
        (SELECT COUNT(*)::int FROM submissions WHERE status = 'confirmed') AS "totalConfirmed"
    `);
    const totals = totalsResult.rows[0] as {
      totalAssignments: number; totalGroups: number;
      totalStudents: number; totalConfirmed: number;
    };

    const maxPossible = totals.totalAssignments * totals.totalGroups;
    const overallCompletionRate =
      maxPossible > 0 ? Math.round((totals.totalConfirmed / maxPossible) * 100) : 0;

    const perAssignmentResult = await pool.query(`
      SELECT a.id AS "assignmentId", a.title,
             COUNT(DISTINCT g.id)::int AS "totalGroups",
             COUNT(DISTINCT s.group_id) FILTER (WHERE s.status = 'confirmed')::int AS "confirmedGroups"
      FROM assignments a CROSS JOIN groups g
      LEFT JOIN submissions s ON s.assignment_id = a.id AND s.group_id = g.id
      GROUP BY a.id, a.title ORDER BY a.created_at DESC
    `);
    const perAssignment = perAssignmentResult.rows.map((row) => ({
      ...row,
      completionRate: row.totalGroups > 0 ? Math.round((row.confirmedGroups / row.totalGroups) * 100) : 0,
    }));

    const perGroupResult = await pool.query(`
      SELECT g.id AS "groupId", g.name,
             COUNT(DISTINCT a.id)::int AS "totalAssignments",
             COUNT(DISTINCT s.assignment_id) FILTER (WHERE s.status = 'confirmed')::int AS "confirmedAssignments"
      FROM groups g CROSS JOIN assignments a
      LEFT JOIN submissions s ON s.group_id = g.id AND s.assignment_id = a.id
      GROUP BY g.id, g.name ORDER BY g.name
    `);
    const perGroup = perGroupResult.rows.map((row) => ({
      ...row,
      completionRate: row.totalAssignments > 0 ? Math.round((row.confirmedAssignments / row.totalAssignments) * 100) : 0,
    }));

    res.status(200).json({
      totalAssignments: totals.totalAssignments,
      totalGroups: totals.totalGroups,
      totalStudents: totals.totalStudents,
      overallCompletionRate,
      perAssignment,
      perGroup,
    });
  } catch (err) {
    console.error('analytics overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/courses/:id/analytics  (admin/professor only)
export async function getCourseAnalytics(req: Request, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: 'Invalid course ID' });
    return;
  }

  try {
    // Verify the course exists and belongs to this professor
    const courseCheck = await pool.query(
      `SELECT id, title FROM courses WHERE id = $1 AND professor_id = $2`,
      [courseId, req.user!.id]
    );
    if (courseCheck.rows.length === 0) {
      res.status(404).json({ error: 'Course not found or access denied' });
      return;
    }

    // Enrolled student count
    const studentCountResult = await pool.query(
      `SELECT COUNT(*)::int AS "studentCount"
       FROM course_enrollments
       WHERE course_id = $1`,
      [courseId]
    );
    const studentCount: number = studentCountResult.rows[0].studentCount;

    // Per-assignment submission status breakdown using SQL aggregates
    const perAssignmentResult = await pool.query(
      `SELECT
         a.id          AS "assignmentId",
         a.title,
         a.due_date    AS "dueDate",
         COUNT(DISTINCT ce.student_id)::int                                    AS "enrolledStudents",
         COUNT(s.id) FILTER (WHERE s.status = 'pending')::int                  AS "pending",
         COUNT(s.id) FILTER (WHERE s.status = 'pending_confirmation')::int     AS "pendingConfirmation",
         COUNT(s.id) FILTER (WHERE s.status = 'confirmed')::int                AS "confirmed",
         COUNT(DISTINCT g.id)::int                                              AS "totalGroups"
       FROM assignments a
       JOIN course_enrollments ce ON ce.course_id = a.course_id
       LEFT JOIN group_members gm ON gm.user_id   = ce.student_id
       LEFT JOIN groups g         ON g.id          = gm.group_id
       LEFT JOIN submissions s    ON s.assignment_id = a.id AND s.group_id = g.id
       WHERE a.course_id = $1
       GROUP BY a.id, a.title, a.due_date
       ORDER BY a.created_at DESC`,
      [courseId]
    );

    // Overall completion % across all assignments in this course
    const totalConfirmed = perAssignmentResult.rows.reduce((sum, r) => sum + r.confirmed, 0);
    const totalGroups    = perAssignmentResult.rows.reduce((sum, r) => sum + r.totalGroups, 0);
    const completionPct  = totalGroups > 0 ? Math.round((totalConfirmed / totalGroups) * 100) : 0;

    res.status(200).json({
      courseId,
      courseTitle:   courseCheck.rows[0].title,
      studentCount,
      completionPct,
      perAssignment: perAssignmentResult.rows,
    });
  } catch (err) {
    console.error('getCourseAnalytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
