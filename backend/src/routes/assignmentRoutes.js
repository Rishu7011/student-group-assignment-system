const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const {
  createAssignment,
  updateAssignment,
  listAssignments,
  getAssignmentById,
} = require('../controllers/assignmentController');

// All routes require authentication
router.use(authenticate);

router.post('/', requireRole('admin'), createAssignment);
router.put('/:id', requireRole('admin'), updateAssignment);
router.get('/', listAssignments);         // role-aware inside controller
router.get('/:id', getAssignmentById);    // role-aware inside controller

module.exports = router;
