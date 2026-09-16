const pool = require('../config/db');

async function submitScorecard(req, res) {
  const bookingId = req.params.id;
  const { communication, problem_solving, code_quality, notes } = req.body;

  const dims = { communication, problem_solving, code_quality };
  for (const [key, value] of Object.entries(dims)) {
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      return res.status(400).json({ error: `${key} must be an integer between 1 and 10` });
    }
  }

  const bookingResult = await pool.query(
    `SELECT b.*, s.interviewer_id, s.end_time
     FROM bookings b
     JOIN slots s ON s.id = b.slot_id
     WHERE b.id = $1`,
    [bookingId]
  );
  const booking = bookingResult.rows[0];

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  if (booking.interviewer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your booking' });
  }
  if (booking.status !== 'confirmed' && booking.status !== 'completed') {
    return res.status(409).json({ error: 'Booking must be confirmed before leaving feedback' });
  }
  if (new Date(booking.end_time) > new Date()) {
    return res.status(409).json({ error: "You can leave feedback once the session's end time has passed" });
  }

  const result = await pool.query(
    `INSERT INTO scorecards (booking_id, communication, problem_solving, code_quality, notes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (booking_id) DO UPDATE SET
       communication = EXCLUDED.communication,
       problem_solving = EXCLUDED.problem_solving,
       code_quality = EXCLUDED.code_quality,
       notes = EXCLUDED.notes
     RETURNING *`,
    [bookingId, communication, problem_solving, code_quality, notes || null]
  );

  await pool.query(`UPDATE bookings SET status = 'completed' WHERE id = $1 AND status = 'confirmed'`, [bookingId]);

  res.status(201).json({ scorecard: result.rows[0] });
}

async function getMyScorecards(req, res) {
  const result = await pool.query(
    `SELECT sc.*, b.slot_id, s.start_time, s.end_time, u.name AS interviewer_name, ip.company
     FROM scorecards sc
     JOIN bookings b ON b.id = sc.booking_id
     JOIN slots s ON s.id = b.slot_id
     JOIN users u ON u.id = s.interviewer_id
     LEFT JOIN interviewer_profiles ip ON ip.user_id = s.interviewer_id
     WHERE b.student_id = $1
     ORDER BY s.start_time ASC`,
    [req.user.id]
  );
  res.json({ scorecards: result.rows });
}

module.exports = { submitScorecard, getMyScorecards };
