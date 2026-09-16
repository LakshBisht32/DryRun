const { startExpireBookingsJob } = require('./expireBookings');
const { startReminderJob } = require('./sendReminders');

function startJobs() {
  startExpireBookingsJob();
  startReminderJob();
}

module.exports = { startJobs };
