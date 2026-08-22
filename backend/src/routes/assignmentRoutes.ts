import { Router } from 'express';
import authenticate from '../middleware/auth';
import requireRole from '../middleware/roles';
import { createAssignment, updateAssignment, listAssignments, getAssignmentById } from '../controllers/assignmentController';

const router = Router();
router.use(authenticate);

router.post('/', requireRole('admin'), createAssignment);
router.put('/:id', requireRole('admin'), updateAssignment);
router.get('/', listAssignments);
router.get('/:id', getAssignmentById);

export default router;
