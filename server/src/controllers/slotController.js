const pool = require('../config/db');

async function createSlot(req, res) {
  const { start_time, end_time } = req.body;

  if (!start_time || !end_time) {
    return res.status(400).json({ error: 'start_time and end_time are required' });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return res.status(400).json({ error: 'start_time and end_time must be valid dates' });
  }
  if (end <= start) {
    return res.status(400).json({ error: 'end_time must be after start_time' });
  }
  if (start < new Date()) {
    return res.status(400).json({ error: 'start_time must be in the future' });
  }

  const result = await pool.query(
    `INSERT INTO slots (interviewer_id, start_time, end_time)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [req.user.id, start.toISOString(), end.toISOString()]
  );

  res.status(201).json({ slot: result.rows[0] });
}

async function listSlotsForInterviewer(req, res) {
  const { status } = req.query;
  const params = [req.params.id];
  let where = 'WHERE interviewer_id = $1';

  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }

  const result = await pool.query(
    `SELECT * FROM slots ${where} ORDER BY start_time ASC`,
    params
  );

  res.json({ slots: result.rows });
}

async function listMySlots(req, res) {
  const result = await pool.query(
    `SELECT * FROM slots WHERE interviewer_id = $1 ORDER BY start_time ASC`,
    [req.user.id]
  );
  res.json({ slots: result.rows });
}

module.exports = { createSlot, listSlotsForInterviewer, listMySlots };
