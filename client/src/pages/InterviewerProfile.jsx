import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatRange, localZoneLabel } from '../utils/time';
import { StarIcon, ShieldCheckIcon } from '../components/Icons';

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function InterviewerProfile() {
  const { id } = useParams();
  const { user, token, logout } = useAuth();
  const [interviewer, setInterviewer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [requestingId, setRequestingId] = useState(null);

  const load = async () => {
    setError('');
    try {
      const [{ interviewer: iv }, { slots: openSlots }] = await Promise.all([
        api.getInterviewer(id),
        api.getInterviewerSlots(id, 'open'),
      ]);
      setInterviewer(iv);
      setSlots(openSlots);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRequest = async (slotId) => {
    setError('');
    setNotice('');
    setRequestingId(slotId);
    try {
      await api.requestSlot(slotId, token);
      setNotice('Request sent! Check your dashboard for updates.');
      await load();
    } catch (err) {
      setError(err.message);
      await load();
    } finally {
      setRequestingId(null);
    }
  };

  if (error && !interviewer) {
    return (
      <div className="app-shell">
        <main className="dashboard-main">
          <div className="error-banner">{error}</div>
        </main>
      </div>
    );
  }

  if (!interviewer) {
    return (
      <div className="app-shell">
        <main className="dashboard-main">
          <p className="muted">Loading…</p>
        </main>
      </div>
    );
  }

  const isVerified = interviewer.verification_status === 'auto_verified' || interviewer.verification_status === 'admin_verified';
  const canRequest = user?.role === 'student';

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </Link>
        <div className="topbar-user">
          {user ? (
            <>
              <span className="badge">{user.role}</span>
              <Link to={`/${user.role}`} className="btn-ghost btn-sm">
                Dashboard
              </Link>
              <button type="button" className="btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ghost btn-sm">
              Log in to book
            </Link>
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <Link to="/interviewers" className="muted" style={{ fontSize: 13.5, textDecoration: 'none' }}>
          ← Back to directory
        </Link>

        <div className="profile-header glass">
          <div className="avatar-circle" style={{ width: 68, height: 68, fontSize: 24 }}>
            {initials(interviewer.name)}
          </div>
          <div className="profile-info">
            <h2>{interviewer.name}</h2>
            <p className="muted">
              {interviewer.role_title} @ {interviewer.company}
              {interviewer.department ? ` · ${interviewer.department}` : ''}
            </p>
            <div className="rating-row">
              <StarIcon />
              <span>
                {Number(interviewer.avg_rating).toFixed(1)} ({interviewer.rating_count} ratings)
              </span>
              {isVerified && (
                <span className="verify-chip verified">
                  <ShieldCheckIcon /> Verified
                </span>
              )}
            </div>
            {interviewer.tags?.length > 0 && (
              <div className="tag-row">
                {interviewer.tags.map((t) => (
                  <span className="tag-chip" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            {interviewer.bio && <p className="profile-bio">{interviewer.bio}</p>}
          </div>
        </div>

        <div>
          <h3 className="section-title">Open slots</h3>
          <p className="section-subtitle">Times shown in your local timezone ({localZoneLabel()}).</p>

          {notice && <div className="success-banner">{notice}</div>}
          {error && <div className="error-banner">{error}</div>}

          {slots.length === 0 ? (
            <div className="empty-state glass">No open slots right now — check back later.</div>
          ) : (
            <div className="slot-list">
              {slots.map((slot) => (
                <div className="slot-row glass" key={slot.id}>
                  <div className="slot-time">
                    <strong>{formatRange(slot.start_time, slot.end_time)}</strong>
                  </div>
                  {canRequest ? (
                    <button
                      type="button"
                      className="grad-btn btn-sm"
                      disabled={requestingId === slot.id}
                      onClick={() => handleRequest(slot.id)}
                    >
                      {requestingId === slot.id ? 'Requesting…' : 'Request this slot'}
                    </button>
                  ) : (
                    <span className="status-pill open">Open</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
