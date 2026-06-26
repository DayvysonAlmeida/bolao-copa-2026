export function DonutChart({ slices, size = 100 }) {
  const tot = slices.reduce((acc, s) => acc + s.value, 0) || 1;
  let curr = 0;
  return (
    <svg width={size} height={size} viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
      {slices.map((s, i) => {
        if (!s.value) return null;
        const pct = s.value / tot;
        const a1 = curr * 2 * Math.PI;
        curr += pct;
        const a2 = curr * 2 * Math.PI;
        const x1 = Math.cos(a1), y1 = Math.sin(a1);
        const x2 = Math.cos(a2), y2 = Math.sin(a2);
        const lg = pct > 0.5 ? 1 : 0;
        return (
          <path key={i} d={`M ${x1} ${y1} A 1 1 0 ${lg} 1 ${x2} ${y2}`}
            fill="none" stroke={s.color} strokeWidth="0.4"
            strokeDasharray={pct === 1 ? "" : "0.02 0"} strokeLinecap="butt" />
        );
      })}
    </svg>
  );
}
