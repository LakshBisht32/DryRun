const express = require('express');
const { createSlot, listMySlots } = require('../controllers/slotController');
const { requestSlot } = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/slots', authenticate, authorize('interviewer'), createSlot);
router.get('/slots/mine', authenticate, authorize('interviewer'), listMySlots);
router.post('/slots/:id/request', authenticate, authorize('student'), requestSlot);

module.exports = router;
