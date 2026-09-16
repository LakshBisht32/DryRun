const cron = require('node-cron');
const pool = require('../config/db');

// Runs once a day: find confirmed bookings starting in the next 24h and
// remind both sides. This is a console.log stub — a real deployment would
// swap this for an email send (e.g. Nodemailer / SendGrid) right where the
// log line is below, using the same query result.
async function sendUpcomingReminders() {
  const result = await pool.query(
    `SELECT b.id AS booking_id, b.meeting_link,
            s.start_time, s.end_time,
            student.id AS student_id, student.email AS student_email, student.name AS student_name,
            interviewer.id AS interviewer_id, interviewer.email AS interviewer_email, interviewer.name AS interviewer_name
     FROM bookings b
     JOIN slots s ON s.id = b.slot_id
     JOIN users student ON student.id = b.student_id
     JOIN users interviewer ON interviewer.id = s.interviewer_id
     WHERE b.status = 'confirmed'
       AND s.start_time BETWEEN now() AND now() + interval '24 hours'`
  );

  for (const row of result.rows) {
    // TODO: replace with a real email send (Nodemailer/SendGrid) using
    // row.student_email / row.interviewer_email once a provider is wired up.
    console.log(
      `[cron:sendReminders] booking #${row.booking_id}: reminding ${row.student_name} (${row.student_email}) ` +
        `and ${row.interviewer_name} (${row.interviewer_email}) — session at ${row.start_time}` +
        (row.meeting_link ? ` — link: ${row.meeting_link}` : ' — no meeting link set yet')
    );
  }

  if (result.rows.length === 0) {
    console.log('[cron:sendReminders] no sessions starting in the next 24h');
  }
}

function startReminderJob() {
  // "0 8 * * *" = once a day at 08:00 server time
  cron.schedule('0 8 * * *', sendUpcomingReminders);
  console.log('[cron:sendReminders] scheduled daily at 08:00');
}

module.exports = { startReminderJob, sendUpcomingReminders };
