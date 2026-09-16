import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { StarIcon, ShieldCheckIcon } from '../components/Icons';

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Interviewers() {
  const { user, token, logout } = useAuth();
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ company: '', tag: '', min_rating: '' });

  const load = async (activeFilters) => {
    setLoading(true);
    setError('');
    try {
      const { interviewers: list } = await api.listInterviewers(activeFilters);
      setInterviewers(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    load(filters);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </Link>
        <div className="topbar-user">
          {user && <span className="badge">{user.role}</span>}
          {user ? (
            <>
              <Link to={`/${user.role}`} className="btn-ghost btn-sm">
                Dashboard
              </Link>
              <button type="button" className="btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ghost btn-sm">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>Find an interviewer</h2>
          <p>Browse working professionals offering mock interview slots.</p>
        </div>

        <form className="filter-bar glass" onSubmit={handleSubmit}>
          <div className="filter-field">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" placeholder="e.g. Stripe" value={filters.company} onChange={handleFilterChange} />
          </div>
          <div className="filter-field">
            <label htmlFor="tag">Tag</label>
            <input id="tag" name="tag" placeholder="e.g. system-design" value={filters.tag} onChange={handleFilterChange} />
          </div>
          <div className="filter-field">
            <label htmlFor="min_rating">Min. rating</label>
            <select id="min_rating" name="min_rating" value={filters.min_rating} onChange={handleFilterChange}>
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>
          <button type="submit" className="grad-btn btn-inline">
            Apply filters
          </button>
        </form>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <p className="muted">Loading interviewers…</p>
        ) : interviewers.length === 0 ? (
          <div className="empty-state glass">No interviewers match those filters yet.</div>
        ) : (
          <div className="card-grid">
            {interviewers.map((iv) => (
              <Link to={`/interviewers/${iv.user_id}`} className="interviewer-card glass" key={iv.user_id}>
                <div className="interviewer-card-head">
                  <div className="avatar-circle">{initials(iv.name)}</div>
                  <div>
                    <div className="interviewer-card-name">{iv.name}</div>
                    <div className="interviewer-card-role">
                      {iv.role_title} @ {iv.company}
                    </div>
                  </div>
                </div>

                {iv.tags?.length > 0 && (
                  <div className="tag-row">
                    {iv.tags.map((t) => (
                      <span className="tag-chip" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rating-row">
                  <StarIcon />
                  <span>
                    {Number(iv.avg_rating).toFixed(1)} ({iv.rating_count})
                  </span>
                  {(iv.verification_status === 'auto_verified' || iv.verification_status === 'admin_verified') && (
                    <span className="verify-chip verified">
                      <ShieldCheckIcon /> Verified
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
