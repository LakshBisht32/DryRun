// Proves the atomic-UPDATE booking logic is actually race-safe.
//
// Sets up one interviewer with one open slot, then fires two simultaneous
// POST /api/slots/:id/request calls (from two different students) at that
// same slot. Asserts exactly one gets a 201 and the other a 409 — never
// both succeeding (double-booked) and never both failing.
//
// Usage: node test-concurrency.js   (server must already be running)

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function post(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@testco.com`;
}

async function signup(role, prefix) {
  const email = uniqueEmail(prefix);
  const { status, data } = await post('/auth/signup', {
    email,
    password: 'password123',
    name: `${prefix} Test`,
    role,
  });
  if (status !== 201) {
    throw new Error(`Signup failed for ${email}: ${JSON.stringify(data)}`);
  }
  return { token: data.token, user: data.user };
}

async function main() {
  console.log(`Testing against ${BASE_URL}`);

  const interviewer = await signup('interviewer', 'interviewer');
  const studentA = await signup('student', 'student-a');
  const studentB = await signup('student', 'student-b');

  const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const slotRes = await post('/slots', { start_time: start, end_time: end }, interviewer.token);
  if (slotRes.status !== 201) {
    throw new Error(`Slot creation failed: ${JSON.stringify(slotRes.data)}`);
  }
  const slotId = slotRes.data.slot.id;
  console.log(`Created slot ${slotId}, status=${slotRes.data.slot.status}`);

  console.log('Firing two simultaneous booking requests at the same slot...');
  const [resA, resB] = await Promise.all([
    post(`/slots/${slotId}/request`, {}, studentA.token),
    post(`/slots/${slotId}/request`, {}, studentB.token),
  ]);

  console.log('Student A:', resA.status, resA.data);
  console.log('Student B:', resB.status, resB.data);

  const statuses = [resA.status, resB.status].sort();
  const successCount = statuses.filter((s) => s === 201).length;
  const conflictCount = statuses.filter((s) => s === 409).length;

  if (successCount === 1 && conflictCount === 1) {
    console.log('\n✅ PASS: exactly one request succeeded (201) and one was rejected (409). No double-booking.');
    process.exit(0);
  } else {
    console.error(`\n❌ FAIL: expected [201, 409], got [${statuses.join(', ')}]`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test errored:', err);
  process.exit(1);
});
