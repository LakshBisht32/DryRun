const WIDTH = 300;
const HEIGHT = 56;
const PAD = 4;

export default function MiniTrendLine({ values }) {
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = n > 1 ? (WIDTH - PAD * 2) / (n - 1) : 0;

  const xFor = (i) => PAD + i * xStep;
  const yFor = (v) => HEIGHT - PAD - ((v - min) / range) * (HEIGHT - PAD * 2);

  const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
  const areaPoints = `${PAD},${HEIGHT - PAD} ${points} ${WIDTH - PAD},${HEIGHT - PAD}`;

  return (
    <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Score trend">
      <defs>
        <linearGradient id="mini-trend-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9b86ff" />
          <stop offset="100%" stopColor="#57d6ff" />
        </linearGradient>
        <linearGradient id="mini-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#57d6ff" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#57d6ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#mini-trend-fill)" />
      <polyline points={points} fill="none" stroke="url(#mini-trend-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
