const express = require('express');
const { getMyScorecards } = require('../controllers/scorecardController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/students/me/scorecards', authenticate, authorize('student'), getMyScorecards);

module.exports = router;
