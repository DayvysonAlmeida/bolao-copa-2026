import { formatTeamName } from '../utils';

export function MatchCard({ match, userBet, loggedUser, handleOpenModal, betChangeDeadlineLabel }) {
  const dateObj = new Date(match.match_date);
  const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  let resultBorderClass = 'border-dark-700';
  let resultShadowClass = '';
  
  if (match.status === 'FINISHED' && userBet) {
    if (userBet.points_earned === 5) {
      resultBorderClass = 'border-yellow-400/80';
      resultShadowClass = 'shadow-[0_0_20px_rgba(250,204,21,0.5)]';
    } else if (userBet.points_earned === 3) {
      resultBorderClass = 'border-neon-green/95';
      resultShadowClass = 'shadow-[0_0_25px_rgba(4,211,97,0.7)]';
    } else if (userBet.points_earned < 3) {
      resultBorderClass = 'border-red-400/80';
      resultShadowClass = 'shadow-[0_0_20px_rgba(248,113,113,0.5)]';
    }
  }

  return (
    <div 
      onClick={() => handleOpenModal(match)}
      className={`relative bg-dark-800 rounded-xl p-5 border transition-all shadow-lg cursor-pointer group ${resultBorderClass} ${resultShadowClass} ${match.status === 'FINISHED' ? 'opacity-60 cursor-not-allowed' : 'hover:border-neon-green'}`}
    >
      {userBet && (
        <div className="absolute top-4 right-4 rounded-full bg-neon-green/15 text-neon-green text-xs font-semibold px-3 py-1 border border-neon-green/30">
          Palpite enviado
        </div>
      )}
      {match.status === 'FINISHED' && userBet && (
        <div className={`absolute top-4 left-4 rounded-full text-xs font-bold px-3 py-1 border ${
          userBet.points_earned === 5 
            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
            : userBet.points_earned === 3
              ? 'bg-neon-green/20 text-neon-green border-neon-green/50'
              : 'bg-red-400/20 text-red-300 border-red-400/50'
        }`}>
          {userBet.points_earned === 5 ? '🎯 Mitou!' : userBet.points_earned === 3 ? '✓ Acertou!' : '✗ Errou'}
        </div>
      )}
      <div className="text-center mb-5 flex justify-center">
        {match.status === 'IN_PROGRESS' ? (
          <span className="flex items-center gap-2 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            AO VIVO
          </span>
        ) : (
          <span className="text-xs font-mono text-gray-400 bg-dark-900 px-3 py-1 rounded-full group-hover:text-neon-green transition-colors">
            {match.status === 'FINISHED' ? 'Encerrado' : `${dayMonth} às ${time}`}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center w-1/3">
          {match.flag_home ? (
            <img src={match.flag_home} alt={match.home_team_name} className="w-12 h-8 rounded-sm shadow-md mb-2 object-cover" />
          ) : (
            <div className="w-12 h-8 bg-dark-700 rounded-sm mb-2 flex items-center justify-center text-xs border border-dark-600">?</div>
          )}
          <span className="text-sm font-semibold text-center truncate w-full text-gray-300">{formatTeamName(match.home_team_name)}</span>
        </div>
        <div className="text-3xl font-black text-white w-1/3 text-center flex flex-col justify-center items-center">
          <div className="flex justify-center items-center gap-3">
            <span>{match.home_score !== null ? match.home_score : '-'}</span>
            <span className="text-gray-600 text-lg font-normal">x</span>
            <span>{match.away_score !== null ? match.away_score : '-'}</span>
          </div>
          {match.penalty_winner_name && (
            <div className="text-[9px] text-yellow-400 mt-1 uppercase tracking-wider font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
              Pênaltis: {match.penalty_winner_name}
            </div>
          )}
        </div>
        <div className="flex flex-col items-center w-1/3">
          {match.flag_away ? (
            <img src={match.flag_away} alt={match.away_team_name} className="w-12 h-8 rounded-sm shadow-md mb-2 object-cover" />
          ) : (
            <div className="w-12 h-8 bg-dark-700 rounded-sm mb-2 flex items-center justify-center text-xs border border-dark-600">?</div>
          )}
          <span className="text-sm font-semibold text-center truncate w-full text-gray-300">{formatTeamName(match.away_team_name)}</span>
        </div>
      </div>
      {loggedUser && userBet && (
        <div className="mt-4 px-4 py-3 rounded-2xl bg-dark-900 border border-dark-700 text-sm text-gray-300">
          <div className="flex flex-col gap-1">
            <div><span className="font-semibold text-neon-green">Seu palpite:</span> {userBet.home_score} x {userBet.away_score}</div>
            {userBet.penalty_winner_name && (
              <div className="text-[11px] text-yellow-400">
                <span className="font-semibold">Classifica:</span> {userBet.penalty_winner_name}
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-gray-500">Prazo para edição: {betChangeDeadlineLabel}</div>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-400">
        {match.status === 'FINISHED'
          ? 'Jogo encerrado - palpites não disponíveis.'
          : userBet
            ? 'Clique no jogo para editar seu palpite.'
            : 'Clique no jogo para enviar seu palpite.'}
      </div>
    </div>
  );
}
