const SERIES = [
  { key: 'communication', label: 'Communication', color: '#9b86ff' },
  { key: 'problem_solving', label: 'Problem solving', color: '#57d6ff' },
  { key: 'code_quality', label: 'Code quality', color: '#6ee7b7' },
];

const WIDTH = 640;
const HEIGHT = 220;
const PAD = 28;

export default function TrendChart({ scorecards }) {
  if (scorecards.length === 0) return null;

  const n = scorecards.length;
  const xStep = n > 1 ? (WIDTH - PAD * 2) / (n - 1) : 0;
  const yFor = (value) => HEIGHT - PAD - ((value - 1) / 9) * (HEIGHT - PAD * 2);
  const xFor = (i) => PAD + i * xStep;

  return (
    <div className="glass" style={{ padding: '20px 24px', overflowX: 'auto' }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Scorecard trend over time">
        {[1, 4, 7, 10].map((tick) => (
          <g key={tick}>
            <line x1={PAD} x2={WIDTH - PAD} y1={yFor(tick)} y2={yFor(tick)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x={4} y={yFor(tick) + 4} fontSize="10" fill="var(--text-muted)">
              {tick}
            </text>
          </g>
        ))}

        {SERIES.map((s) => {
          const points = scorecards.map((sc, i) => `${xFor(i)},${yFor(sc[s.key])}`).join(' ');
          return (
            <g key={s.key}>
              <polyline points={points} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {scorecards.map((sc, i) => (
                <circle key={i} cx={xFor(i)} cy={yFor(sc[s.key])} r="3.5" fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
        {SERIES.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted-2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
