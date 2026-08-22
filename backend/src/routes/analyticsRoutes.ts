import { Router } from 'express';
import authenticate from '../middleware/auth';
import requireRole from '../middleware/roles';
import { overview } from '../controllers/analyticsController';

const router = Router();
router.use(authenticate);

router.get('/overview', requireRole('admin'), overview);

export default router;
