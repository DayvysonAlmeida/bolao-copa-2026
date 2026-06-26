export function DonutChart({ slices, size = 100 }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const COLORS = ['#04d361', '#eab308', '#3b82f6', '#f87171'];
  let offset = 0;
  const total = slices.reduce((a, s) => a + s.pct, 0) || 1;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#29292e" strokeWidth={size * 0.16} />
      {slices.map((s, i) => {
        const dash = (s.pct / total) * circ;
        const gap = circ - dash;
        const color = s.color ? s.color.replace('bg-', '') : COLORS[i % COLORS.length];
        
        let hexColor = color;
        if (color === 'neon-green') hexColor = '#04d361';
        if (color === 'yellow-400') hexColor = '#facc15';
        if (color === 'blue-500') hexColor = '#3b82f6';

        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={hexColor} strokeWidth={size * 0.16}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 1s ease-out' }} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}
