const express = require('express');
const {
  acceptBooking,
  rejectBooking,
  setMeetingLink,
  cancelBooking,
  listMyBookingsAsStudent,
  listMyBookingsAsInterviewer,
} = require('../controllers/bookingController');
const { submitScorecard } = require('../controllers/scorecardController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/bookings/mine/student', authenticate, authorize('student'), listMyBookingsAsStudent);
router.get('/bookings/mine/interviewer', authenticate, authorize('interviewer'), listMyBookingsAsInterviewer);

router.post('/bookings/:id/accept', authenticate, authorize('interviewer'), acceptBooking);
router.post('/bookings/:id/reject', authenticate, authorize('interviewer'), rejectBooking);
router.post('/bookings/:id/meeting-link', authenticate, authorize('interviewer'), setMeetingLink);
router.post('/bookings/:id/cancel', authenticate, cancelBooking);
router.post('/bookings/:id/scorecard', authenticate, authorize('interviewer'), submitScorecard);

module.exports = router;
