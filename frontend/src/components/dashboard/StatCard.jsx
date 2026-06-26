export function StatCard({ icon, label, value, sub, color = 'neon-green', highlight = false }) {
  const colorMap = {
    'neon-green': 'border-neon-green/20 bg-neon-green/5 hover:border-neon-green/40',
    'yellow': 'border-yellow-400/20 bg-yellow-400/5 hover:border-yellow-400/40',
    'blue': 'border-blue-400/20 bg-blue-400/5 hover:border-blue-400/40',
    'red': 'border-red-400/20 bg-red-400/5 hover:border-red-400/40',
    'purple': 'border-purple-400/20 bg-purple-400/5 hover:border-purple-400/40',
  };
  const valColorMap = {
    'neon-green': 'text-neon-green',
    'yellow': 'text-yellow-400',
    'blue': 'text-blue-400',
    'red': 'text-red-400',
    'purple': 'text-purple-400',
  };
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-4 transition-all group ${colorMap[color]}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</p>
        <p className={`text-3xl font-black leading-tight ${highlight ? valColorMap[color] : 'text-white'}`}>{value}</p>
        {sub && <p className="text-[10px] text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}
