import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatRange, formatDateTime, localInputToUtcIso, localZoneLabel } from '../utils/time';
import ScorecardForm from '../components/ScorecardForm';
import { CheckIcon, XIcon, LinkIcon } from '../components/Icons';

export default function InterviewerDashboard() {
  const { user, token, logout } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slotForm, setSlotForm] = useState({ start: '', end: '' });
  const [slotError, setSlotError] = useState('');
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [linkDrafts, setLinkDrafts] = useState({});
  const [feedbackOpenId, setFeedbackOpenId] = useState(null);
  const [notice, setNotice] = useState('');

  const loadAll = async () => {
    const [{ slots: mySlots }, { bookings: myBookings }] = await Promise.all([
      api.listMySlots(token),
      api.listMyBookingsAsInterviewer(token),
    ]);
    setSlots(mySlots);
    setBookings(myBookings);
  };

  useEffect(() => {
    loadAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSlotError('');
    setCreatingSlot(true);
    try {
      await api.createSlot(
        {
          start_time: localInputToUtcIso(slotForm.start),
          end_time: localInputToUtcIso(slotForm.end),
        },
        token
      );
      setSlotForm({ start: '', end: '' });
      await loadAll();
    } catch (err) {
      setSlotError(err.message);
    } finally {
      setCreatingSlot(false);
    }
  };

  const handleAccept = async (bookingId) => {
    setBusyId(bookingId);
    try {
      const meeting_link = linkDrafts[bookingId];
      await api.acceptBooking(bookingId, meeting_link ? { meeting_link } : {}, token);
      await loadAll();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await api.rejectBooking(bookingId, token);
      await loadAll();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveLink = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await api.setMeetingLink(bookingId, linkDrafts[bookingId], token);
      await loadAll();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (bookingId) => {
    setBusyId(bookingId);
    try {
      await api.cancelBooking(bookingId, token);
      await loadAll();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleScorecard = async (bookingId, payload) => {
    setBusyId(bookingId);
    try {
      await api.submitScorecard(bookingId, payload, token);
      setFeedbackOpenId(null);
      await loadAll();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();
  const pending = bookings.filter((b) => b.status === 'pending');
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.end_time).getTime() > now);
  const awaitingFeedback = bookings.filter((b) => b.status === 'confirmed' && new Date(b.end_time).getTime() <= now);
  const completed = bookings.filter((b) => b.status === 'completed');

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
          <Link to="/interviewer/profile" className="btn-ghost btn-sm">
            Edit profile
          </Link>
          <button type="button" className="btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>Welcome back, {user.name.split(' ')[0]}</h2>
          <p>Manage your slots, requests, and feedback.</p>
        </div>

        {notice && (
          <div className="error-banner" role="alert">
            {notice}
          </div>
        )}

        <div className="glass dashboard-card">
          <h3 className="section-title">Add a new slot</h3>
          <p className="section-subtitle">Times you pick below are in your local timezone ({localZoneLabel()}) and stored/converted safely.</p>
          {slotError && <div className="error-banner">{slotError}</div>}
          <form className="form-grid" onSubmit={handleCreateSlot}>
            <div className="form-group">
              <label htmlFor="start">Start</label>
              <input
                id="start"
                type="datetime-local"
                required
                value={slotForm.start}
                onChange={(e) => setSlotForm({ ...slotForm, start: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="end">End</label>
              <input
                id="end"
                type="datetime-local"
                required
                value={slotForm.end}
                onChange={(e) => setSlotForm({ ...slotForm, end: e.target.value })}
              />
            </div>
            <div className="form-group span-2">
              <button type="submit" className="grad-btn btn-inline" disabled={creatingSlot}>
                {creatingSlot ? 'Adding…' : 'Add slot'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h3 className="section-title">Pending requests</h3>
          {pending.length === 0 ? (
            <p className="muted">No pending requests.</p>
          ) : (
            <div className="slot-list">
              {pending.map((b) => (
                <div className="booking-row glass" key={b.id}>
                  <div className="booking-row-info">
                    <strong>{b.student_name}</strong>
                    <span>{formatRange(b.start_time, b.end_time)}</span>
                  </div>
                  <div className="booking-actions">
                    <input
                      placeholder="Meeting link (optional)"
                      style={{
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--text)',
                        fontSize: 13,
                        width: 200,
                      }}
                      value={linkDrafts[b.id] || ''}
                      onChange={(e) => setLinkDrafts({ ...linkDrafts, [b.id]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="grad-btn btn-sm"
                      disabled={busyId === b.id}
                      onClick={() => handleAccept(b.id)}
                    >
                      <CheckIcon /> Accept
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      disabled={busyId === b.id}
                      onClick={() => handleReject(b.id)}
                    >
                      <XIcon /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="section-title">Upcoming sessions</h3>
          {upcoming.length === 0 ? (
            <p className="muted">Nothing confirmed yet.</p>
          ) : (
            <div className="slot-list">
              {upcoming.map((b) => (
                <div className="session-card glass" key={b.id}>
                  <div className="session-card-top">
                    <div className="booking-row-info">
                      <strong>{b.student_name}</strong>
                      <span>{formatRange(b.start_time, b.end_time)}</span>
                    </div>
                    <span className="status-pill confirmed">Confirmed</span>
                  </div>
                  <div className="meeting-link-row">
                    <input
                      placeholder="https://meet.google.com/..."
                      style={{
                        flex: 1,
                        minWidth: 180,
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'var(--text)',
                        fontSize: 13.5,
                      }}
                      defaultValue={b.meeting_link || ''}
                      onChange={(e) => setLinkDrafts({ ...linkDrafts, [b.id]: e.target.value })}
                    />
                    <button type="button" className="btn-ghost btn-sm" disabled={busyId === b.id} onClick={() => handleSaveLink(b.id)}>
                      Save link
                    </button>
                    {b.meeting_link && (
                      <a href={b.meeting_link} target="_blank" rel="noreferrer" className="grad-btn btn-sm">
                        <LinkIcon /> Join session
                      </a>
                    )}
                    <button type="button" className="btn-danger btn-sm" disabled={busyId === b.id} onClick={() => handleCancel(b.id)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="section-title">Awaiting your feedback</h3>
          {awaitingFeedback.length === 0 ? (
            <p className="muted">No sessions waiting on a scorecard.</p>
          ) : (
            <div className="slot-list">
              {awaitingFeedback.map((b) => (
                <div className="session-card glass" key={b.id}>
                  <div className="session-card-top">
                    <div className="booking-row-info">
                      <strong>{b.student_name}</strong>
                      <span>{formatRange(b.start_time, b.end_time)}</span>
                    </div>
                    {feedbackOpenId !== b.id && (
                      <button type="button" className="grad-btn btn-sm" onClick={() => setFeedbackOpenId(b.id)}>
                        Leave feedback
                      </button>
                    )}
                  </div>
                  {feedbackOpenId === b.id && (
                    <ScorecardForm submitting={busyId === b.id} onSubmit={(payload) => handleScorecard(b.id, payload)} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {completed.length > 0 && (
          <div>
            <h3 className="section-title">Completed</h3>
            <div className="slot-list">
              {completed.map((b) => (
                <div className="booking-row glass" key={b.id}>
                  <div className="booking-row-info">
                    <strong>{b.student_name}</strong>
                    <span>{formatDateTime(b.start_time)}</span>
                  </div>
                  <span className="status-pill completed">Scored</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
