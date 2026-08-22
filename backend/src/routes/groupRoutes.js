const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const {
  createGroup,
  addMember,
  getMyGroups,
  getAllGroups,
  getGroupById,
} = require('../controllers/groupController');

// All routes require authentication
router.use(authenticate);

router.post('/', requireRole('student'), createGroup);
router.post('/:id/members', requireRole('student'), addMember);
router.get('/mine', requireRole('student'), getMyGroups);
router.get('/all', requireRole('admin'), getAllGroups);
router.get('/:id', getGroupById); // student (own group) or admin

module.exports = router;
