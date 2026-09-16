const pool = require('../config/db');

// Interviewers often paste a link without a scheme (e.g. "meet.google.com/abc-defg-hij").
// Rendered as <a href="meet.google.com/abc-defg-hij">, a browser treats that as a path
// relative to the current page instead of an external URL, so "Join session" silently
// breaks. Normalize by assuming https when no scheme is present, then validate.
function normalizeMeetingLink(rawLink) {
  const trimmed = rawLink.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes('.')) {
    return null;
  }
  return parsed.toString();
}

// The core concurrency-safe booking primitive: a single atomic conditional
// UPDATE instead of read-then-write. If two requests race for the same slot,
// only one UPDATE can flip status 'open' -> 'pending'; the loser sees 0 rows
// affected and is rejected with a clean 409, no locking or read-modify-write
// window required.
async function requestSlot(req, res) {
  const slotId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE slots SET status = 'pending' WHERE id = $1 AND status = 'open'`,
      [slotId]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot was just taken — please pick another.' });
    }

    const slotResult = await client.query(`SELECT * FROM slots WHERE id = $1`, [slotId]);
    const slot = slotResult.rows[0];

    if (!slot) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found' });
    }
    if (slot.interviewer_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "You can't book your own slot" });
    }

    const bookingResult = await client.query(
      `INSERT INTO bookings (slot_id, student_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [slotId, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ booking: bookingResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function loadBookingWithSlot(bookingOrClient, id) {
  const result = await bookingOrClient.query(
    `SELECT b.*, s.interviewer_id, s.start_time, s.end_time, s.status AS slot_status
     FROM bookings b
     JOIN slots s ON s.id = b.slot_id
     WHERE b.id = $1`,
    [id]
  );
  return result.rows[0];
}

async function acceptBooking(req, res) {
  const bookingId = req.params.id;
  const { meeting_link } = req.body;
  let normalizedLink = null;

  if (meeting_link) {
    normalizedLink = normalizeMeetingLink(meeting_link);
    if (!normalizedLink) {
      return res.status(400).json({ error: 'meeting_link must be a valid URL' });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const booking = await loadBookingWithSlot(client, bookingId);
    if (!booking) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.interviewer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Booking is already ${booking.status}` });
    }

    const updated = await client.query(
      `UPDATE bookings SET status = 'confirmed', confirmed_at = now(), meeting_link = COALESCE($2, meeting_link)
       WHERE id = $1 RETURNING *`,
      [bookingId, normalizedLink]
    );
    await client.query(`UPDATE slots SET status = 'booked' WHERE id = $1`, [booking.slot_id]);

    await client.query('COMMIT');
    res.json({ booking: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function rejectBooking(req, res) {
  const bookingId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const booking = await loadBookingWithSlot(client, bookingId);
    if (!booking) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.interviewer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Booking is already ${booking.status}` });
    }

    const updated = await client.query(
      `UPDATE bookings SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [bookingId]
    );
    await client.query(`UPDATE slots SET status = 'open' WHERE id = $1`, [booking.slot_id]);

    await client.query('COMMIT');
    res.json({ booking: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function setMeetingLink(req, res) {
  const bookingId = req.params.id;
  const { meeting_link } = req.body;

  if (!meeting_link) {
    return res.status(400).json({ error: 'meeting_link is required' });
  }
  const normalizedLink = normalizeMeetingLink(meeting_link);
  if (!normalizedLink) {
    return res.status(400).json({ error: 'meeting_link must be a valid URL' });
  }

  const booking = await loadBookingWithSlot(pool, bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  if (booking.interviewer_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your booking' });
  }
  if (booking.status !== 'confirmed') {
    return res.status(409).json({ error: 'Booking must be confirmed first' });
  }

  const updated = await pool.query(
    `UPDATE bookings SET meeting_link = $2 WHERE id = $1 RETURNING *`,
    [bookingId, normalizedLink]
  );
  res.json({ booking: updated.rows[0] });
}

async function cancelBooking(req, res) {
  const bookingId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const booking = await loadBookingWithSlot(client, bookingId);
    if (!booking) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isParticipant = booking.interviewer_id === req.user.id || booking.student_id === req.user.id;
    if (!isParticipant) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: `Booking is already ${booking.status}` });
    }

    const twoHoursBeforeStart = new Date(booking.start_time).getTime() - 2 * 60 * 60 * 1000;
    if (Date.now() > twoHoursBeforeStart) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Cancellations must happen more than 2 hours before the slot starts' });
    }

    const updated = await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [bookingId]
    );
    await client.query(`UPDATE slots SET status = 'open' WHERE id = $1`, [booking.slot_id]);

    await client.query('COMMIT');
    res.json({ booking: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listMyBookingsAsStudent(req, res) {
  const result = await pool.query(
    `SELECT b.*, s.start_time, s.end_time, s.interviewer_id,
            u.name AS interviewer_name, ip.company, ip.role_title
     FROM bookings b
     JOIN slots s ON s.id = b.slot_id
     JOIN users u ON u.id = s.interviewer_id
     LEFT JOIN interviewer_profiles ip ON ip.user_id = s.interviewer_id
     WHERE b.student_id = $1
     ORDER BY s.start_time DESC`,
    [req.user.id]
  );
  res.json({ bookings: result.rows });
}

async function listMyBookingsAsInterviewer(req, res) {
  const result = await pool.query(
    `SELECT b.*, s.start_time, s.end_time, u.name AS student_name, u.email AS student_email
     FROM bookings b
     JOIN slots s ON s.id = b.slot_id
     JOIN users u ON u.id = b.student_id
     WHERE s.interviewer_id = $1
     ORDER BY s.start_time DESC`,
    [req.user.id]
  );
  res.json({ bookings: result.rows });
}

module.exports = {
  requestSlot,
  acceptBooking,
  rejectBooking,
  setMeetingLink,
  cancelBooking,
  listMyBookingsAsStudent,
  listMyBookingsAsInterviewer,
};
