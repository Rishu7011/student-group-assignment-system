import { Request, Response } from 'express';
import pool from '../config/db';

// ─── POST /api/courses  (admin/professor only) ───────────────────────────────
export async function createCourse(req: Request, res: Response): Promise<void> {
  const { title, description } = req.body as { title?: string; description?: string };

  if (!title || title.trim().length === 0) {
    res.status(400).json({ error: 'title is required' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (title, description, professor_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title.trim(), description?.trim() ?? null, req.user!.id]
    );
    res.status(201).json({ course: result.rows[0] });
  } catch (err) {
    console.error('createCourse error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── POST /api/courses/:id/enroll  (admin only — professor enrolls students) ─
export async function enrollStudent(req: Request, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id, 10);
  const { student_id } = req.body as { student_id?: number };

  if (isNaN(courseId)) {
    res.status(400).json({ error: 'Invalid course ID' });
    return;
  }
  if (!student_id) {
    res.status(400).json({ error: 'student_id is required' });
    return;
  }

  try {
    // Verify the course exists and belongs to this professor
    const courseCheck = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND professor_id = $2`,
      [courseId, req.user!.id]
    );
    if (courseCheck.rows.length === 0) {
      res.status(404).json({ error: 'Course not found or you are not the professor of this course' });
      return;
    }

    // Verify the target user is a student
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'student'`,
      [student_id]
    );
    if (userCheck.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (course_id, student_id) DO NOTHING
       RETURNING *`,
      [courseId, student_id]
    );

    if (result.rows.length === 0) {
      res.status(200).json({ message: 'Student already enrolled in this course' });
    } else {
      res.status(201).json({ enrollment: result.rows[0] });
    }
  } catch (err) {
    console.error('enrollStudent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── GET /api/courses/mine  (role-aware) ─────────────────────────────────────
export async function getMyCourses(req: Request, res: Response): Promise<void> {
  try {
    let rows;

    if (req.user!.role === 'admin') {
      // Professor: courses they created, with enrolled student count + assignment count
      const result = await pool.query(
        `SELECT
           c.*,
           COUNT(DISTINCT ce.student_id)::int  AS "enrolledStudents",
           COUNT(DISTINCT a.id)::int            AS "assignmentCount"
         FROM courses c
         LEFT JOIN course_enrollments ce ON ce.course_id = c.id
         LEFT JOIN assignments a         ON a.course_id  = c.id
         WHERE c.professor_id = $1
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [req.user!.id]
      );
      rows = result.rows;
    } else {
      // Student: courses they are enrolled in, with assignment count
      const result = await pool.query(
        `SELECT
           c.*,
           COUNT(DISTINCT a.id)::int AS "assignmentCount"
         FROM courses c
         JOIN course_enrollments ce ON ce.course_id = c.id AND ce.student_id = $1
         LEFT JOIN assignments a    ON a.course_id  = c.id
         GROUP BY c.id
         ORDER BY c.created_at DESC`,
        [req.user!.id]
      );
      rows = result.rows;
    }

    res.status(200).json({ courses: rows });
  } catch (err) {
    console.error('getMyCourses error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── GET /api/courses/:id  (authenticated) ───────────────────────────────────
export async function getCourseById(req: Request, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: 'Invalid course ID' });
    return;
  }

  try {
    const courseResult = await pool.query(
      `SELECT
         c.*,
         u.name AS professor_name,
         COUNT(DISTINCT ce.student_id)::int AS "enrolledStudents"
       FROM courses c
       JOIN users u ON u.id = c.professor_id
       LEFT JOIN course_enrollments ce ON ce.course_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, u.name`,
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const course = courseResult.rows[0];

    // Fetch assignments belonging to this course
    const assignmentResult = await pool.query(
      `SELECT a.*, u.name AS creator_name
       FROM assignments a
       JOIN users u ON u.id = a.created_by
       WHERE a.course_id = $1
       ORDER BY a.created_at DESC`,
      [courseId]
    );

    course.assignments = assignmentResult.rows;

    res.status(200).json({ course });
  } catch (err) {
    console.error('getCourseById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── GET /api/courses/catalog  (authenticated) ───────────────────────────────
export async function getCourseCatalog(req: Request, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT
         c.*,
         u.name AS professor_name,
         COUNT(DISTINCT ce.student_id)::int AS "enrolledStudents",
         COUNT(DISTINCT a.id)::int          AS "assignmentCount",
         EXISTS(
           SELECT 1 FROM course_enrollments ce2
           WHERE ce2.course_id = c.id AND ce2.student_id = $1
         ) AS "isEnrolled"
       FROM courses c
       LEFT JOIN users u               ON u.id = c.professor_id
       LEFT JOIN course_enrollments ce ON ce.course_id = c.id
       LEFT JOIN assignments a         ON a.course_id  = c.id
       GROUP BY c.id, u.name
       ORDER BY c.title ASC`,
      [req.user!.id]
    );

    res.status(200).json({ courses: result.rows });
  } catch (err) {
    console.error('getCourseCatalog error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ─── POST /api/courses/:id/self-enroll  (student self-enrollment) ────────────
export async function selfEnrollCourse(req: Request, res: Response): Promise<void> {
  const courseId = parseInt(req.params.id, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: 'Invalid course ID' });
    return;
  }

  try {
    const courseCheck = await pool.query(
      `SELECT id, title FROM courses WHERE id = $1`,
      [courseId]
    );
    if (courseCheck.rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO course_enrollments (course_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (course_id, student_id) DO NOTHING
       RETURNING *`,
      [courseId, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(200).json({ message: 'You are already enrolled in this course', courseTitle: courseCheck.rows[0].title });
    } else {
      res.status(201).json({ message: `Successfully enrolled in ${courseCheck.rows[0].title}`, enrollment: result.rows[0] });
    }
  } catch (err) {
    console.error('selfEnrollCourse error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

