const cron = require('node-cron');
const pool = require('../config/db');

// Runs hourly: any booking still 'pending' 24h+ after it was requested means
// the interviewer never responded. Expire it and free the slot back up.
async function expireStalePendingBookings() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const stale = await client.query(
      `UPDATE bookings SET status = 'expired'
       WHERE status = 'pending' AND requested_at < now() - interval '24 hours'
       RETURNING id, slot_id`
    );

    for (const booking of stale.rows) {
      await client.query(`UPDATE slots SET status = 'open' WHERE id = $1`, [booking.slot_id]);
    }

    await client.query('COMMIT');
    if (stale.rows.length > 0) {
      console.log(`[cron:expireBookings] expired ${stale.rows.length} stale pending booking(s)`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[cron:expireBookings] failed:', err);
  } finally {
    client.release();
  }
}

function startExpireBookingsJob() {
  // "0 * * * *" = top of every hour
  cron.schedule('0 * * * *', expireStalePendingBookings);
  console.log('[cron:expireBookings] scheduled hourly');
}

module.exports = { startExpireBookingsJob, expireStalePendingBookings };
