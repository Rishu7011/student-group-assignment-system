import { Router } from 'express';
import authenticate from '../middleware/auth';
import requireRole from '../middleware/roles';
import {
  createCourse,
  enrollStudent,
  getMyCourses,
  getCourseById,
  getCourseCatalog,
  selfEnrollCourse,
} from '../controllers/courseController';
import { getCourseAnalytics } from '../controllers/analyticsController';

const router = Router();

// All course routes require authentication
router.use(authenticate);

// POST /api/courses                  — professor/admin creates a course
router.post('/', requireRole('admin'), createCourse);

// GET  /api/courses/catalog          — list all university courses with enrollment status
router.get('/catalog', getCourseCatalog);

// POST /api/courses/:id/enroll       — professor enrolls a student
router.post('/:id/enroll', requireRole('admin'), enrollStudent);

// POST /api/courses/:id/self-enroll  — student self-enrolls into a course
router.post('/:id/self-enroll', selfEnrollCourse);

// GET  /api/courses/mine             — role-aware: professor → own courses; student → enrolled courses
router.get('/mine', getMyCourses);

// GET  /api/courses/:id/analytics    — professor-only course analytics
router.get('/:id/analytics', requireRole('admin'), getCourseAnalytics);

// GET  /api/courses/:id              — course detail (authenticated)
router.get('/:id', getCourseById);

export default router;
