const express = require('express');
const {
  upsertProfile,
  getMyProfile,
  listInterviewers,
  getInterviewer,
} = require('../controllers/interviewerController');
const { listSlotsForInterviewer } = require('../controllers/slotController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/interviewers', listInterviewers);
router.get('/interviewers/:id', getInterviewer);
router.get('/interviewers/:id/slots', listSlotsForInterviewer);

router.post('/interviewer-profile', authenticate, authorize('interviewer'), upsertProfile);
router.get('/interviewer-profile/me', authenticate, authorize('interviewer'), getMyProfile);

module.exports = router;
