import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICONS = {
  users: (
    <svg className="icon" width="20" height="20" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  chart: (
    <svg className="icon" width="20" height="20" viewBox="0 0 24 24">
      <path d="M3 3v18h18" />
      <path d="M18.7 8 13 13.7l-3-3L4 16.7" />
    </svg>
  ),
  calendar: (
    <svg className="icon" width="20" height="20" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  shield: (
    <svg className="icon" width="20" height="20" viewBox="0 0 24 24">
      <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
};

const FEATURES = [
  {
    icon: 'users',
    title: 'Real professionals',
    description: 'Practice with working professionals from your target industry, not just a script.',
  },
  {
    icon: 'chart',
    title: 'Structured scorecards',
    description: 'Every session ends with rated feedback across fixed dimensions, so you can track your trend over time.',
  },
  {
    icon: 'calendar',
    title: 'Flexible scheduling',
    description: 'Interviewers post open slots; you book whatever fits your schedule. No back-and-forth emails.',
  },
  {
    icon: 'shield',
    title: 'Layered trust & verification',
    description: 'Work-email matching, manual profile review, and two-way ratings keep the community honest.',
  },
];

const STEPS = [
  { number: '1', title: 'Create your profile', description: 'Sign up as a student or an interviewer in under a minute.' },
  { number: '2', title: 'Book a session', description: 'Browse open slots and request the time that works for you.' },
  { number: '3', title: 'Get real feedback', description: 'Walk away with a scorecard you can track and improve on.' },
];

export default function Home() {
  const { token, user } = useAuth();
  const isAuthed = Boolean(token && user);

  return (
    <div className="home-page">
      <div className="aurora-blob violet" style={{ width: 520, height: 520, top: -220, left: -160 }} />
      <div className="aurora-blob cyan" style={{ width: 460, height: 460, top: -160, right: -180 }} />

      <header className="home-nav">
        <div className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </div>
        <nav className="home-nav-links">
          {isAuthed ? (
            <Link to={`/${user.role}`} className="grad-btn btn-inline">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-inline">
                Log in
              </Link>
              <Link to="/signup" className="grad-btn btn-inline">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <h1>
            Walk into your real interview <span className="grad-text">already warmed up</span>
          </h1>
          <p className="hero-subtitle">
            DryRun pairs students with working professionals for scheduled mock interviews,
            structured feedback, and a scorecard that shows you improving over time.
          </p>
          <div className="hero-cta-row">
            <Link to={isAuthed ? `/${user.role}` : '/signup'} className="grad-btn btn-large">
              Take your first interview prep step →
            </Link>
            {!isAuthed && (
              <Link to="/login" className="btn-ghost btn-large">
                Log in
              </Link>
            )}
          </div>
        </section>

        <section className="features">
          <h2>Why DryRun</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card glass" key={f.title}>
                <div className="feature-icon">{ICONS[f.icon]}</div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="steps">
          <h2>How it works</h2>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div className="step-card" key={s.number}>
                <span className="step-number">{s.number}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>DryRun — mock interviews with real feedback.</p>
      </footer>
    </div>
  );
}
