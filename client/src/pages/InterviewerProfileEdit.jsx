import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function InterviewerProfileEdit() {
  const { user, token, logout } = useAuth();
  const [form, setForm] = useState({
    company: '',
    role_title: '',
    department: '',
    years_experience: '',
    bio: '',
    tags: '',
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getMyInterviewerProfile(token)
      .then(({ profile }) => {
        setForm({
          company: profile.company || '',
          role_title: profile.role_title || '',
          department: profile.department || '',
          years_experience: profile.years_experience || '',
          bio: profile.bio || '',
          tags: (profile.tags || []).join(', '),
        });
        setStatus(profile.verification_status);
      })
      .catch(() => {});
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const payload = {
        company: form.company,
        role_title: form.role_title,
        department: form.department || undefined,
        years_experience: form.years_experience ? Number(form.years_experience) : undefined,
        bio: form.bio || undefined,
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const { profile } = await api.saveInterviewerProfile(payload, token);
      setStatus(profile.verification_status);
      setSuccess('Profile saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </Link>
        <div className="topbar-user">
          <span className="badge">Interviewer</span>
          <span>{user.name}</span>
          <Link to="/interviewer" className="btn-ghost btn-sm">
            Dashboard
          </Link>
          <button type="button" className="btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main" style={{ maxWidth: 640 }}>
        <div className="dashboard-header">
          <h2>Your interviewer profile</h2>
          <p>Shown to students browsing the directory.</p>
        </div>

        {status && (
          <div className={status === 'pending' ? 'error-banner' : 'success-banner'}>
            {status === 'pending' && "Your work email didn't auto-verify — this profile is visible, but flagged as unverified until reviewed."}
            {status === 'auto_verified' && 'Verified automatically via your work email domain.'}
            {status === 'admin_verified' && 'Verified by an admin.'}
            {status === 'rejected' && 'Your verification request was rejected. Contact support.'}
          </div>
        )}

        <form className="glass auth-form" style={{ padding: 32 }} onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input id="company" name="company" value={form.company} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="role_title">Role title</label>
              <input id="role_title" name="role_title" value={form.role_title} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input id="department" name="department" value={form.department} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="years_experience">Years of experience</label>
              <input
                id="years_experience"
                name="years_experience"
                type="number"
                min="0"
                value={form.years_experience}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input id="tags" name="tags" placeholder="backend, system-design, react" value={form.tags} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" rows={4} value={form.bio} onChange={handleChange} />
          </div>

          <button type="submit" className="grad-btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </main>
    </div>
  );
}
