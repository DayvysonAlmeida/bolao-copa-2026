export function MatchRow({ match, userBet, onClick, showBet = false }) {
  const d = new Date(match.match_date);
  const isLive = match.status === 'IN_PROGRESS';
  const isDone = match.status === 'FINISHED';

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer
        ${isDone ? 'border-dark-700 opacity-75' : isLive
          ? 'border-red-500/40 bg-red-500/5 hover:border-red-400/60'
          : 'border-dark-700 hover:border-neon-green/40 hover:bg-dark-700/50'}`}
    >
      {/* Time casa */}
      <div className="flex items-center gap-2 w-28">
        {match.flag_home ? <img src={match.flag_home} alt="" className="w-7 h-5 object-cover rounded-sm" /> : <span>🏴</span>}
        <span className="text-xs font-semibold text-gray-200 truncate">{match.home_team_name}</span>
      </div>

      {/* Placar / horário */}
      <div className="flex flex-col items-center min-w-[80px]">
        {isDone || isLive ? (
          <span className="text-lg font-black text-white">{match.home_score} <span className="text-gray-500 text-sm">×</span> {match.away_score}</span>
        ) : (
          <span className="text-xs text-gray-400 font-mono">
            {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 mt-0.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />AO VIVO
          </span>
        )}
        {match.penalty_winner_name && (
          <span className="text-[8px] text-yellow-400 bg-yellow-400/10 px-1 py-0.5 rounded uppercase font-bold mt-1">
            Pen: {match.home_penalty_score !== null ? `${match.home_penalty_score}x${match.away_penalty_score}` : match.penalty_winner_name}
          </span>
        )}
        {showBet && userBet && (
          <span className="text-[9px] text-neon-green/80 mt-0.5 flex flex-col items-center">
            <span>Palpite: {userBet.home_score}×{userBet.away_score}</span>
          </span>
        )}
      </div>

      {/* Time visitante */}
      <div className="flex items-center justify-end gap-2 w-28">
        <span className="text-xs font-semibold text-gray-200 truncate text-right">{match.away_team_name}</span>
        {match.flag_away ? <img src={match.flag_away} alt="" className="w-7 h-5 object-cover rounded-sm" /> : <span>🏴</span>}
      </div>
    </div>
  );
}
