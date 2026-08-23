import { Router } from 'express';
import authenticate from '../middleware/auth';
import requireRole from '../middleware/roles';
import {
  stepOne,
  stepTwo,
  getStatusForAssignment,
  getStatusForGroup,
  reviewSubmission,
} from '../controllers/submissionController';

const router = Router();
router.use(authenticate);

router.post('/:assignmentId/step1', requireRole('student'), stepOne);
router.post('/:assignmentId/step2', requireRole('student'), stepTwo);
router.patch('/:assignmentId/groups/:groupId/review', requireRole('admin'), reviewSubmission);
router.get('/assignment/:id', requireRole('admin'), getStatusForAssignment);
router.get('/group/:id', getStatusForGroup);

export default router;
