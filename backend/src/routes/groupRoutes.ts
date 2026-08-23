import { Router } from 'express';
import authenticate from '../middleware/auth';
import requireRole from '../middleware/roles';
import { createGroup, addMember, deleteMember, deleteGroup, getMyGroups, getAllGroups, getGroupById } from '../controllers/groupController';

const router = Router();
router.use(authenticate);

router.post('/', requireRole('student'), createGroup);
router.post('/:id/members', requireRole('student'), addMember);
router.delete('/:id/members/:userId', requireRole('student'), deleteMember);
router.delete('/:id', requireRole('student'), deleteGroup);
router.get('/mine', requireRole('student'), getMyGroups);
router.get('/all', requireRole('admin'), getAllGroups);
router.get('/:id', getGroupById);

export default router;
