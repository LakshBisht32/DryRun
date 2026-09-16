import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function InterviewerDashboard() {
  const { user, token, logout } = useAuth();
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.interviewerDashboard(token).then((data) => setMessage(data.message)).catch(() => {});
  }, [token]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </div>
        <div className="topbar-user">
          <span className="badge">Interviewer</span>
          <span>{user.name}</span>
          <button type="button" className="btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-card glass">
          <h2>Welcome back, {user.name.split(' ')[0]}</h2>
          <p className="muted">{user.email}</p>
          <p>{message}</p>
        </div>
      </main>
    </div>
  );
}
