import { StatCard } from './StatCard';
import { DonutChart } from './DonutChart';

export function DashboardHeader({
  urgentMatches, handleOpenModal, firstName, streakBadge, userRankData,
  userRankPos, myPoints, isLeader, exactBets, winnerBets, hitRate,
  totalBets, precisionSlices
}) {
  return (
    <>
      {/* ── Banner de Urgência ──────────────────────────────────────── */}
      {urgentMatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-600/90 to-orange-500/90 border border-red-400 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-[pulse_2s_ease-in-out_infinite]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-white font-black uppercase tracking-wider">Atenção! Palpite Atrasado!</h3>
              <p className="text-red-100 text-sm">Você tem {urgentMatches.length} jogo(s) começando nas próximas 12 horas sem palpite oficial. Não perca pontos!</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal(urgentMatches[0])} className="px-4 py-2 bg-white text-red-600 font-bold rounded-xl hover:scale-105 transition-transform shadow-lg">
            Resolver Agora
          </button>
        </div>
      )}

      {/* ── Header personalizado ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-gray-400 text-sm">Bem-vindo de volta,</p>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">{firstName} <span className="text-neon-green">👋</span></h2>
              {streakBadge && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${streakBadge.color}`}>
                  {streakBadge.icon} {streakBadge.text}
                </span>
              )}
            </div>
          </div>
        </div>
        {userRankData && (
          <div className="flex items-center gap-3 bg-dark-800 border border-neon-green/20 rounded-2xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-neon-green/20 border-2 border-neon-green/50 flex items-center justify-center font-black text-neon-green text-lg">
              {firstName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Sua posição</p>
              <p className="font-black text-base text-neon-green leading-tight">
                {userRankPos + 1}º lugar · <span className="text-white">{myPoints} pts</span>
              </p>
            </div>
            {isLeader && <span className="text-2xl">👑</span>}
          </div>
        )}
      </div>

      {/* ── Meus cards de stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard icon="🏆" label="Posição" value={userRankPos >= 0 ? `${userRankPos + 1}º` : '--'} sub="no ranking" color="yellow" highlight />
        <StatCard icon="⭐" label="Pontos" value={myPoints} sub="totais" color="neon-green" highlight />
        <StatCard icon="🎯" label="Cravadas" value={exactBets} sub="+5 pts" color="blue" />
        <StatCard icon="✅" label="Acertos" value={winnerBets} sub="+3 pts" color="neon-green" />
        <StatCard icon="📊" label="Hit Rate" value={`${hitRate}%`} sub={`${totalBets} palpites`} color={hitRate >= 50 ? 'neon-green' : hitRate >= 30 ? 'yellow' : 'red'} highlight />

        {/* Gráfico Circular de Precisão */}
        <div className="rounded-2xl border border-dark-700 bg-dark-800 p-3 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-20"><span className="text-4xl">🎯</span></div>
          <div className="w-12 h-12 flex-shrink-0 z-10"><DonutChart slices={precisionSlices} size={48} /></div>
          <div className="flex flex-col z-10 w-full">
            <div className="flex justify-between items-center w-full"><span className="text-[9px] text-gray-400 font-bold">EXATO</span><span className="text-[10px] text-neon-green font-black">{precisionSlices[0].pct.toFixed(0)}%</span></div>
            <div className="flex justify-between items-center w-full"><span className="text-[9px] text-gray-400 font-bold">ACERTO</span><span className="text-[10px] text-yellow-400 font-black">{precisionSlices[1].pct.toFixed(0)}%</span></div>
            <div className="flex justify-between items-center w-full"><span className="text-[9px] text-gray-400 font-bold">ERRO</span><span className="text-[10px] text-red-400 font-black">{precisionSlices[2].pct.toFixed(0)}%</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
