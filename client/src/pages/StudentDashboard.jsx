import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatRange } from '../utils/time';
import { LinkIcon } from '../components/Icons';

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const { bookings: mine } = await api.listMyBookingsAsStudent(token);
    setBookings(mine);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await api.cancelBooking(bookingId, token);
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();
  const pending = bookings.filter((b) => b.status === 'pending');
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.end_time).getTime() > now);
  const past = bookings.filter(
    (b) => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.end_time).getTime() <= now)
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </Link>
        <div className="topbar-user">
          <span className="badge">Student</span>
          <span>{user.name}</span>
          <Link to="/interviewers" className="btn-ghost btn-sm">
            Browse interviewers
          </Link>
          <Link to="/student/scorecards" className="btn-ghost btn-sm">
            My scorecards
          </Link>
          <button type="button" className="btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>Welcome back, {user.name.split(' ')[0]}</h2>
          <p>Track your requests and upcoming mock interviews.</p>
        </div>

        {notice && <div className="error-banner">{notice}</div>}

        {bookings.length === 0 && (
          <div className="glass dashboard-card">
            <h3 className="section-title">No bookings yet</h3>
            <p className="muted">Find an interviewer and request a slot to get started.</p>
            <div style={{ marginTop: 12 }}>
              <Link to="/interviewers" className="grad-btn btn-inline">
                Browse interviewers
              </Link>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h3 className="section-title">Upcoming sessions</h3>
            <div className="slot-list">
              {upcoming.map((b) => (
                <div className="session-card glass" key={b.id}>
                  <div className="session-card-top">
                    <div className="booking-row-info">
                      <strong>
                        {b.interviewer_name} — {b.role_title} @ {b.company}
                      </strong>
                      <span>{formatRange(b.start_time, b.end_time)}</span>
                    </div>
                    <span className="status-pill confirmed">Confirmed</span>
                  </div>
                  <div className="meeting-link-row">
                    {b.meeting_link ? (
                      <a href={b.meeting_link} target="_blank" rel="noreferrer" className="grad-btn btn-sm">
                        <LinkIcon /> Join session
                      </a>
                    ) : (
                      <span className="muted" style={{ fontSize: 13 }}>
                        Meeting link not added yet — check back closer to the session.
                      </span>
                    )}
                    <button type="button" className="btn-danger btn-sm" disabled={busyId === b.id} onClick={() => handleCancel(b.id)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h3 className="section-title">Pending requests</h3>
            <div className="slot-list">
              {pending.map((b) => (
                <div className="booking-row glass" key={b.id}>
                  <div className="booking-row-info">
                    <strong>
                      {b.interviewer_name} — {b.role_title} @ {b.company}
                    </strong>
                    <span>{formatRange(b.start_time, b.end_time)}</span>
                  </div>
                  <span className="status-pill pending">Awaiting response</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h3 className="section-title">Past sessions</h3>
            <div className="slot-list">
              {past.map((b) => (
                <div className="booking-row glass" key={b.id}>
                  <div className="booking-row-info">
                    <strong>
                      {b.interviewer_name} — {b.role_title} @ {b.company}
                    </strong>
                    <span>{formatRange(b.start_time, b.end_time)}</span>
                  </div>
                  <span className={`status-pill ${b.status === 'completed' ? 'completed' : 'pending'}`}>
                    {b.status === 'completed' ? 'Scored' : 'Feedback pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
