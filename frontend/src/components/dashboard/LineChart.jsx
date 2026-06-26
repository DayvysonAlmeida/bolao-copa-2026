export function LineChart({ labels, series }) {
  const W = 520, H = 160, PX = 40, PY = 14;
  const iW = W - PX * 2, iH = H - PY * 2;
  const allVals = series.flatMap(s => s.data);
  if (!allVals.length) return null;
  const minV = Math.max(0, Math.min(...allVals) - 5);
  const maxV = Math.max(...allVals) + 5;
  const toX = i => PX + (i / Math.max(labels.length - 1, 1)) * iW;
  const toY = v => PY + iH - ((v - minV) / Math.max(maxV - minV, 1)) * iH;
  const COLORS = ['#04d361', '#3b82f6', '#eab308', '#f87171', '#a78bfa'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, 0.33, 0.66, 1].map((t, i) => {
        const y = PY + t * iH;
        return (
          <g key={i}>
            <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#29292e" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PX - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#4b5563">{Math.round(maxV - t * (maxV - minV))}</text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={toX(i)} y={H - 2} textAnchor="middle" fontSize="8" fill="#4b5563">{l}</text>
      ))}
      {series.map((s, i) => {
        const pts = s.data.map((v, j) => `${toX(j)},${toY(v)}`).join(' ');
        const c = s.isMe ? COLORS[0] : COLORS[(i % (COLORS.length - 1)) + 1];
        return (
          <g key={i}>
            <polyline fill="none" stroke={c} strokeWidth={s.isMe ? "3" : "1.5"} opacity={s.isMe ? "1" : "0.5"} strokeLinecap="round" strokeLinejoin="round" points={pts} className={s.isMe ? "drop-shadow-[0_0_8px_rgba(4,211,97,0.8)]" : ""} />
            {s.data.map((v, j) => (
              <circle key={j} cx={toX(j)} cy={toY(v)} r={s.isMe ? "3" : "2"} fill={s.isMe ? "#000" : "#121214"} stroke={c} strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
