import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { formatDateTime } from '../utils/time';
import TrendChart from '../components/TrendChart';

export default function StudentScorecards() {
  const { user, token, logout } = useAuth();
  const [scorecards, setScorecards] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMyScorecards(token)
      .then(({ scorecards: list }) => setScorecards(list))
      .catch((err) => setError(err.message));
  }, [token]);

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
          <Link to="/student" className="btn-ghost btn-sm">
            Dashboard
          </Link>
          <button type="button" className="btn-ghost btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <h2>Your scorecards</h2>
          <p>Feedback from every completed mock interview, and how you're trending.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {scorecards.length === 0 ? (
          <div className="empty-state glass">No scorecards yet — they'll show up here after your first completed session.</div>
        ) : (
          <>
            <TrendChart scorecards={scorecards} />

            <div className="slot-list">
              {scorecards.map((sc) => (
                <div className="glass dashboard-card" key={sc.id}>
                  <div className="session-card-top" style={{ marginBottom: 14 }}>
                    <div>
                      <strong>
                        {sc.interviewer_name}
                        {sc.company ? ` — ${sc.company}` : ''}
                      </strong>
                      <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                        {formatDateTime(sc.start_time)}
                      </div>
                    </div>
                  </div>
                  <div className="score-grid">
                    <div>
                      <div className="score-pill-num grad-text">{sc.communication}</div>
                      <div className="score-dim-label">Communication</div>
                    </div>
                    <div>
                      <div className="score-pill-num grad-text">{sc.problem_solving}</div>
                      <div className="score-dim-label">Problem solving</div>
                    </div>
                    <div>
                      <div className="score-pill-num grad-text">{sc.code_quality}</div>
                      <div className="score-dim-label">Code quality</div>
                    </div>
                  </div>
                  {sc.notes && <p style={{ marginTop: 14, color: 'var(--text-muted-2)', fontSize: 14 }}>{sc.notes}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
