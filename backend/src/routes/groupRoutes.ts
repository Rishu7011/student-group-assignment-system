import { Router } from 'express';
import authenticate from '../middleware/auth';
import requireRole from '../middleware/roles';
import { createGroup, addMember, getMyGroups, getAllGroups, getGroupById } from '../controllers/groupController';

const router = Router();
router.use(authenticate);

router.post('/', requireRole('student'), createGroup);
router.post('/:id/members', requireRole('student'), addMember);
router.get('/mine', requireRole('student'), getMyGroups);
router.get('/all', requireRole('admin'), getAllGroups);
router.get('/:id', getGroupById);

export default router;
