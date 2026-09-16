import { useState } from 'react';

const DIMENSIONS = [
  { key: 'communication', label: 'Communication' },
  { key: 'problem_solving', label: 'Problem solving' },
  { key: 'code_quality', label: 'Code quality' },
];

export default function ScorecardForm({ onSubmit, submitting }) {
  const [scores, setScores] = useState({ communication: 6, problem_solving: 6, code_quality: 6 });
  const [notes, setNotes] = useState('');

  const handleChange = (key, value) => setScores({ ...scores, [key]: Number(value) });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...scores, notes });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {DIMENSIONS.map((d) => (
        <div className="form-group" key={d.key}>
          <label>{d.label}</label>
          <div className="range-row">
            <input
              type="range"
              min="1"
              max="10"
              value={scores[d.key]}
              onChange={(e) => handleChange(d.key, e.target.value)}
            />
            <span className="range-value">{scores[d.key]}</span>
          </div>
        </div>
      ))}
      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          rows={3}
          placeholder="What went well, what to work on…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button type="submit" className="grad-btn btn-inline" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </button>
    </form>
  );
}
