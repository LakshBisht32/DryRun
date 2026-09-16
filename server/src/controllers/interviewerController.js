const pool = require('../config/db');

const isCompanyDomain = (email) => {
  const GENERIC = new Set([
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'protonmail.com', 'aol.com', 'live.com', 'mail.com', 'gmx.com',
  ]);
  const domain = email.split('@')[1]?.toLowerCase();
  return Boolean(domain) && !GENERIC.has(domain);
};

async function upsertProfile(req, res) {
  const { company, role_title, department, years_experience, bio, tags } = req.body;

  if (!company || !role_title) {
    return res.status(400).json({ error: 'company and role_title are required' });
  }

  const existing = await pool.query(
    `SELECT user_id FROM interviewer_profiles WHERE user_id = $1`,
    [req.user.id]
  );

  let verificationStatus = existing.rows[0]?.verification_status;

  if (existing.rows.length === 0) {
    const userResult = await pool.query(`SELECT email FROM users WHERE id = $1`, [req.user.id]);
    verificationStatus = isCompanyDomain(userResult.rows[0].email) ? 'auto_verified' : 'pending';
  }

  const result = await pool.query(
    `INSERT INTO interviewer_profiles (user_id, company, role_title, department, years_experience, bio, tags, verification_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'pending'))
     ON CONFLICT (user_id) DO UPDATE SET
       company = EXCLUDED.company,
       role_title = EXCLUDED.role_title,
       department = EXCLUDED.department,
       years_experience = EXCLUDED.years_experience,
       bio = EXCLUDED.bio,
       tags = EXCLUDED.tags
     RETURNING *`,
    [
      req.user.id,
      company,
      role_title,
      department || null,
      years_experience || null,
      bio || null,
      tags && Array.isArray(tags) ? tags : null,
      existing.rows.length === 0 ? verificationStatus : undefined,
    ]
  );

  res.status(existing.rows.length === 0 ? 201 : 200).json({ profile: result.rows[0] });
}

async function getMyProfile(req, res) {
  const result = await pool.query(
    `SELECT ip.*, u.name, u.email
     FROM interviewer_profiles ip
     JOIN users u ON u.id = ip.user_id
     WHERE ip.user_id = $1`,
    [req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'No profile yet' });
  }
  res.json({ profile: result.rows[0] });
}

async function listInterviewers(req, res) {
  const { company, tag, min_rating } = req.query;
  const conditions = [];
  const params = [];

  if (company) {
    params.push(`%${company}%`);
    conditions.push(`ip.company ILIKE $${params.length}`);
  }
  if (tag) {
    params.push(tag);
    conditions.push(`$${params.length} = ANY(ip.tags)`);
  }
  if (min_rating) {
    params.push(Number(min_rating));
    conditions.push(`ip.avg_rating >= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await pool.query(
    `SELECT ip.user_id, ip.company, ip.role_title, ip.department, ip.years_experience,
            ip.bio, ip.tags, ip.verification_status, ip.avg_rating, ip.rating_count,
            u.name
     FROM interviewer_profiles ip
     JOIN users u ON u.id = ip.user_id
     ${where}
     ORDER BY ip.avg_rating DESC, ip.rating_count DESC`,
    params
  );

  res.json({ interviewers: result.rows });
}

async function getInterviewer(req, res) {
  const result = await pool.query(
    `SELECT ip.user_id, ip.company, ip.role_title, ip.department, ip.years_experience,
            ip.bio, ip.tags, ip.verification_status, ip.avg_rating, ip.rating_count,
            u.name
     FROM interviewer_profiles ip
     JOIN users u ON u.id = ip.user_id
     WHERE ip.user_id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Interviewer not found' });
  }
  res.json({ interviewer: result.rows[0] });
}

module.exports = { upsertProfile, getMyProfile, listInterviewers, getInterviewer, isCompanyDomain };
