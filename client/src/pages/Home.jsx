import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { SearchIcon, CalendarIcon, VideoIcon, TrendUpIcon, StarIcon, CheckIcon } from '../components/Icons';
import MiniTrendLine from '../components/MiniTrendLine';

const STEPS = [
  {
    icon: <SearchIcon />,
    title: 'Browse',
    description: 'Filter interviewers by company, role, and experience level.',
  },
  {
    icon: <CalendarIcon />,
    title: 'Book',
    description: 'Pick an open slot straight from their calendar — no back-and-forth.',
  },
  {
    icon: <VideoIcon />,
    title: 'Interview',
    description: 'Meet over video for a realistic, role-specific mock interview.',
  },
  {
    icon: <TrendUpIcon />,
    title: 'Improve',
    description: 'Get a structured scorecard and track your growth over time.',
  },
];

const STATS = [
  { value: '3,200+', label: 'Mock interviews completed' },
  { value: '4.8 / 5', label: 'Average interviewer rating' },
  { value: '210+', label: 'Verified interviewers' },
  { value: '92%', label: 'Felt more confident after' },
];

const SHOWCASE_SCORES = [
  { key: 'communication', label: 'Communication', value: 9 },
  { key: 'problem_solving', label: 'Problem-solving', value: 7 },
  { key: 'code_quality', label: 'Code quality', value: 8 },
];

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Home() {
  const { token, user } = useAuth();
  const isAuthed = Boolean(token && user);
  const [previewInterviewers, setPreviewInterviewers] = useState([]);

  useEffect(() => {
    api
      .listInterviewers({})
      .then(({ interviewers }) => setPreviewInterviewers(interviewers.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <header className="site-nav">
        <Link to="/" className="topbar-brand">
          <span className="brand-mark small">D</span>
          <strong>DryRun</strong>
        </Link>
        <nav className="site-nav-links">
          <a href="#how-it-works">How it works</a>
          <Link to="/interviewers">Interviewers</Link>
          <Link to="/signup?role=interviewer">For interviewers</Link>
        </nav>
        <div className="site-nav-actions">
          {isAuthed ? (
            <Link to={`/${user.role}`} className="grad-btn btn-sm">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-text-link">
                Log in
              </Link>
              <Link to="/signup" className="grad-btn btn-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="aurora-blob violet" style={{ width: 520, height: 520, top: -220, left: -160 }} />
          <div className="aurora-blob cyan" style={{ width: 460, height: 460, top: -160, right: -180 }} />

          <div className="hero-split">
            <div className="hero-copy">
              <span className="hero-badge">
                <span className="hero-badge-dot" /> MOCK INTERVIEWS, DONE PROPERLY
              </span>
              <h1>
                Rehearse the
                <br />
                <span className="grad-text">real thing.</span>
              </h1>
              <p className="hero-subtitle">
                DryRun pairs you with working engineers for scheduled mock interviews, then turns every session into a
                structured scorecard — so you always know exactly what to fix before the interview that counts.
              </p>
              <div className="hero-cta-row">
                <Link to="/interviewers" className="grad-btn btn-large">
                  Find an interviewer
                </Link>
                <Link to="/signup?role=interviewer" className="btn-ghost btn-large">
                  Become an interviewer →
                </Link>
              </div>
            </div>

            <div className="hero-visual">
              <div className="session-preview-card glass">
                <div className="preview-row-top">
                  <span className="eyebrow-label">UPCOMING SESSION</span>
                  <span className="status-pill confirmed">Confirmed</span>
                </div>

                <div className="preview-person">
                  <div className="avatar-circle">MC</div>
                  <div>
                    <div className="preview-person-name">Marcus Chen</div>
                    <div className="preview-person-role">SDE II · Fernbank Systems</div>
                  </div>
                </div>

                <div className="preview-grid">
                  <div>
                    <span className="eyebrow-label">DATE</span>
                    <strong>Thu, Sep 18</strong>
                  </div>
                  <div>
                    <span className="eyebrow-label">TIME</span>
                    <strong>7:00 PM IST</strong>
                  </div>
                  <div>
                    <span className="eyebrow-label">FOCUS</span>
                    <strong>System Design</strong>
                  </div>
                </div>

                <div className="grad-btn" style={{ width: '100%' }}>
                  Join session
                </div>
              </div>

              <div className="scorecard-mini-card glass">
                <span className="eyebrow-label">LAST SCORECARD</span>
                <div className="mini-score-row">
                  <span>Problem-solving</span>
                  <strong>8/10</strong>
                </div>
                <div className="mini-score-row">
                  <span>Communication</span>
                  <strong className="grad-text">9/10</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <span className="section-eyebrow">HOW IT WORKS</span>
          <h2>Four steps between you and useful feedback.</h2>
          <div className="step-grid">
            {STEPS.map((s, i) => (
              <div className="step-icon-card glass" key={s.title}>
                <div className="step-icon-box">{s.icon}</div>
                <span className="eyebrow-label">STEP 0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="interviewers-preview" id="interviewers-preview">
          <div className="section-heading-row">
            <div>
              <span className="section-eyebrow">THE INTERVIEWERS</span>
              <h2>
                Practice with people who've sat on
                <br />
                the other side of the table.
              </h2>
            </div>
            <p className="section-side-note">Every interviewer is a working professional, verified before they're listed.</p>
          </div>

          {previewInterviewers.length === 0 ? (
            <div className="empty-state glass">Interviewers will show up here as soon as a few join — be the first.</div>
          ) : (
            <div className="card-grid">
              {previewInterviewers.map((iv) => (
                <Link to={`/interviewers/${iv.user_id}`} className="interviewer-card glass" key={iv.user_id}>
                  <div className="interviewer-card-head">
                    <div className="avatar-ring">{initials(iv.name)}</div>
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
                      {Number(iv.avg_rating).toFixed(1)} ({iv.rating_count} sessions)
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="scorecard-showcase" id="scorecards">
          <div className="showcase-copy">
            <span className="section-eyebrow">SCORECARDS</span>
            <h2>See exactly what to work on next.</h2>
            <p className="hero-subtitle">
              After every session, your interviewer scores you across the dimensions that actually matter — not just a
              thumbs up. Every scorecard rolls into your dashboard, so trends show up before your next real interview
              does.
            </p>
            <ul className="check-list">
              <li>
                <CheckIcon /> Scored across communication, problem-solving, and code quality
              </li>
              <li>
                <CheckIcon /> Freeform notes on what to fix before the next session
              </li>
              <li>
                <CheckIcon /> A running trend line across every mock interview you take
              </li>
            </ul>
          </div>

          <div className="scorecard-detail-card glass">
            <div className="preview-row-top">
              <div>
                <strong>Session with Marcus Chen</strong>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Sep 12 · System Design
                </div>
              </div>
              <span className="status-pill completed">Scored</span>
            </div>

            <div className="progress-list">
              {SHOWCASE_SCORES.map((d) => (
                <div className="progress-row" key={d.key}>
                  <div className="progress-row-label">
                    <span>{d.label}</span>
                    <strong>{d.value} / 10</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${d.value * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="quote-box">"Strong on edge cases — work on thinking out loud earlier in the design."</div>

            <span className="eyebrow-label">TREND · LAST 6 SESSIONS</span>
            <MiniTrendLine values={[5, 6, 6, 7, 8, 9]} />
          </div>
        </section>

        <section className="stats-row">
          {STATS.map((s) => (
            <div className="stat-item" key={s.label}>
              <div className="stat-number grad-text">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="final-cta">
          <h2>
            Your next interview shouldn't be
            <br />
            your first practice run.
          </h2>
          <Link to="/signup" className="grad-btn btn-large">
            Get started free
          </Link>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="topbar-brand">
              <span className="brand-mark small">D</span>
              <strong>DryRun</strong>
            </div>
            <p className="muted">Scheduled mock interviews with real engineers, and the feedback loop to actually improve from them.</p>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">PRODUCT</span>
            <a href="#how-it-works">How it works</a>
            <Link to="/interviewers">Interviewers</Link>
            <a href="#scorecards">Scorecards</a>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">FOR INTERVIEWERS</span>
            <Link to="/signup?role=interviewer">Apply</Link>
            <a href="#how-it-works">Guidelines</a>
          </div>

          <div className="footer-col">
            <span className="footer-col-title">COMPANY</span>
            <span className="footer-static">About</span>
            <span className="footer-static">Contact</span>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} DryRun. A student project.</div>
      </footer>
    </div>
  );
}
