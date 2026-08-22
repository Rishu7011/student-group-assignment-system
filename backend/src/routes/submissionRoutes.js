const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const {
  stepOne,
  stepTwo,
  getStatusForAssignment,
  getStatusForGroup,
} = require('../controllers/submissionController');

router.use(authenticate);

router.post('/:assignmentId/step1', requireRole('student'), stepOne);
router.post('/:assignmentId/step2', requireRole('student'), stepTwo);
router.get('/assignment/:id', requireRole('admin'), getStatusForAssignment);
router.get('/group/:id', getStatusForGroup); // student (own group) or admin

module.exports = router;
