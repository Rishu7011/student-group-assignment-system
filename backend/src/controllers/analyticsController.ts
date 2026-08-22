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
