const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;
const VALID_ROLES = ['student', 'interviewer'];

async function signup(req, res) {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, and role are required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, name`,
      [email.toLowerCase(), passwordHash, role, name]
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await pool.query(
    `SELECT id, email, password_hash, role, name FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
}

async function me(req, res) {
  const result = await pool.query(
    `SELECT id, email, role, name FROM users WHERE id = $1`,
    [req.user.id]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
}

module.exports = { signup, login, me };
