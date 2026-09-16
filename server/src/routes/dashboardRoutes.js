const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/student', authenticate, authorize('student'), (req, res) => {
  res.json({ message: `Welcome, student #${req.user.id}` });
});

router.get('/interviewer', authenticate, authorize('interviewer'), (req, res) => {
  res.json({ message: `Welcome, interviewer #${req.user.id}` });
});

module.exports = router;
