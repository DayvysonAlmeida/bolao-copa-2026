import { useState } from 'react';
import { LineChart } from './LineChart';

export function DashboardMiddle({
  liveMatches, userBets, myLastResults, setActiveTab, chartLabels, seriesRaw,
  isLeader, leaderId, secadorLeaderGames, top5, leaderBets, loggedUser,
  userRankPos, userRankData, firstName, myPoints
}) {
  const [secadorIndex, setSecadorIndex] = useState(0);

  return (
    <>
      {/* ── Jogos ao vivo (com meu palpite destacado) ─────────────────── */}
      {liveMatches.length > 0 && (
        <div className="bg-dark-800 border border-red-500/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider">⚡ Jogos Ao Vivo — Veja como você está!</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {liveMatches.map(m => {
              const myBet = userBets.find(b => b.match === m.id);
              const homeWin = m.home_score > m.away_score;
              const awayWin = m.away_score > m.home_score;
              const betHomeWin = myBet && myBet.home_score > myBet.away_score;
              const betAwayWin = myBet && myBet.away_score > myBet.home_score;
              const betDraw = myBet && myBet.home_score === myBet.away_score;
              const exactNow = myBet && m.home_score === myBet.home_score && m.away_score === myBet.away_score;
              const winnerNow = myBet && !exactNow && ((homeWin && betHomeWin) || (awayWin && betAwayWin) || (!homeWin && !awayWin && betDraw));

              return (
                <div key={m.id} className={`rounded-xl border p-3 ${exactNow ? 'border-yellow-400/50 bg-yellow-400/5' : winnerNow ? 'border-neon-green/50 bg-neon-green/5' : myBet ? 'border-red-400/30 bg-red-400/5' : 'border-dark-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {m.flag_home && <img src={m.flag_home} alt="" className="w-7 h-5 object-cover rounded-sm" />}
                      <span className="text-xs font-bold text-white">{m.home_team_name}</span>
                    </div>
                    <span className="text-xl font-black text-white">{m.home_score} <span className="text-gray-500 text-sm">×</span> {m.away_score}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.away_team_name}</span>
                      {m.flag_away && <img src={m.flag_away} alt="" className="w-7 h-5 object-cover rounded-sm" />}
                    </div>
                  </div>
                  {myBet ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Seu palpite: <span className="text-gray-200 font-semibold">{myBet.home_score} × {myBet.away_score}</span></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${exactNow ? 'text-yellow-300 bg-yellow-400/15' : winnerNow ? 'text-neon-green bg-neon-green/15' : 'text-red-400 bg-red-400/10'}`}>
                        {exactNow ? '🎯 Exato até agora!' : winnerNow ? '✓ Vencedor certo!' : '✗ Por enquanto...'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">Você não palpitou neste jogo.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Linha central ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap xl:flex-nowrap gap-4">
        {/* Meus últimos resultados */}
        <div className="flex-1 min-w-[280px] bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">📋 Histórico</h3>
            <button onClick={() => setActiveTab('matches')} className="text-xs text-neon-green hover:underline">Ver todos →</button>
          </div>
          {myLastResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Nenhum resultado ainda.</p>
              <button onClick={() => setActiveTab('matches')} className="mt-3 text-xs text-neon-green hover:underline">Ir palpitar agora →</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myLastResults.map(bet => {
                const m = bet.matchData;
                if (!m) return null;
                const exact = bet.points_earned === 5;
                const winner = bet.points_earned === 3;
                return (
                  <div key={bet.id} className={`rounded-xl border p-3 ${exact ? 'border-yellow-400/40 bg-yellow-400/5' : winner ? 'border-neon-green/40 bg-neon-green/5' : 'border-red-400/20 bg-red-400/5'}`}>
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {m.flag_home && <img src={m.flag_home} alt="" className="w-6 h-4 object-cover rounded-sm" />}
                      <span className="text-xs font-bold text-white">{m.home_team_name}</span>
                      <span className="text-sm font-black text-white">{m.home_score}×{m.away_score}</span>
                      <span className="text-xs font-bold text-white">{m.away_team_name}</span>
                      {m.flag_away && <img src={m.flag_away} alt="" className="w-6 h-4 object-cover rounded-sm" />}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">Palpite: <span className="text-gray-300">{bet.home_score}×{bet.away_score}</span></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${exact ? 'text-yellow-300 bg-yellow-400/10' : winner ? 'text-neon-green bg-neon-green/10' : 'text-red-400 bg-red-400/10'}`}>
                        {exact ? '🎯 Exato' : winner ? '✓ Acertou' : '✗ Errou'} · {bet.points_earned > 0 ? `+${bet.points_earned}` : '0'}pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico de evolução */}
        <div className="flex-1 min-w-[280px] bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">📈 Evolução de Pontos</h3>
          </div>
          <div className="flex flex-wrap gap-3 mb-2">
            {seriesRaw.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ['#04d361', '#3b82f6', '#eab308'][i] }} />
                <span className={`text-[10px] ${s.isMe ? 'text-neon-green font-bold' : 'text-gray-400'}`}>{s.name}</span>
              </div>
            ))}
          </div>
          <div className="h-40">
            <LineChart labels={chartLabels} series={seriesRaw} />
          </div>
        </div>

        {/* Secador do Líder */}
        {!isLeader && leaderId && secadorLeaderGames.length > 0 && top5.length > 0 && (
          <div className="flex-1 min-w-[280px] bg-dark-800 border border-blue-500/20 rounded-2xl p-4 bg-gradient-to-br from-dark-800 to-blue-900/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👀</span>
              <h3 className="font-bold text-blue-400 text-sm uppercase tracking-wider">Secador do Líder</h3>
            </div>
            {(() => {
              const isSimul = secadorLeaderGames.length > 1;
              const curIdx = secadorIndex >= secadorLeaderGames.length ? 0 : secadorIndex;
              const nextM = secadorLeaderGames[curIdx];
              if (!nextM) return null;

              const myB = userBets.find(b => b.match === nextM.id) || {};
              const leaderB = leaderBets.find(b => b.match === nextM.id) || {};
              
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center justify-center gap-2 flex-1">
                      {nextM.flag_home && <img src={nextM.flag_home} className="w-5 h-3 object-cover rounded-sm" alt="" />}
                      <span className="text-xs text-gray-400 font-bold uppercase">{nextM.home_team_name} x {nextM.away_team_name}</span>
                      {nextM.flag_away && <img src={nextM.flag_away} className="w-5 h-3 object-cover rounded-sm" alt="" />}
                    </div>
                    {isSimul && (
                      <div className="flex items-center justify-center gap-1.5 bg-dark-900/50 px-2 py-0.5 rounded-lg border border-blue-500/30">
                        <button onClick={() => setSecadorIndex(prev => prev > 0 ? prev - 1 : secadorLeaderGames.length - 1)} className="text-blue-400 hover:text-white transition-colors">◀</button>
                        <span className="text-[10px] text-blue-400 font-bold">{curIdx + 1}/{secadorLeaderGames.length}</span>
                        <button onClick={() => setSecadorIndex(prev => prev < secadorLeaderGames.length - 1 ? prev + 1 : 0)} className="text-blue-400 hover:text-white transition-colors">▶</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-neon-green/30 bg-neon-green/5 rounded-xl p-3 text-center flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">O seu palpite</p>
                      {myB.match ? (
                         <p className="text-2xl font-black text-white">{myB.home_score} x {myB.away_score}</p>
                      ) : (
                         <p className="text-xs text-gray-400 mt-2 italic">Ainda não palpitou</p>
                      )}
                    </div>
                    <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-3 text-center flex flex-col justify-center relative overflow-hidden">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Palpite de {top5[0].first_name || top5[0].username}</p>
                      {leaderB.match ? (
                        <p className="text-2xl font-black text-white">{leaderB.home_score} x {leaderB.away_score}</p>
                      ) : (
                        <p className="text-[11px] text-blue-400 mt-2 italic font-medium">Líder fazendo mistério... 🤫</p>
                      )}
                    </div>
                  </div>
                  {leaderB.match && myB.match && myB.home_score === leaderB.home_score && myB.away_score === leaderB.away_score && (
                    <p className="text-[10px] text-yellow-500 text-center mt-1">Vocês colocaram o mesmo placar! Ninguém ganha vantagem.</p>
                  )}
                  {leaderB.match && myB.match && (myB.home_score !== leaderB.home_score || myB.away_score !== leaderB.away_score) && (
                    <p className="text-[10px] text-neon-green text-center mt-1 font-bold">Chance de tirar a diferença! Torça contra!</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {isLeader && (
          <div className="flex-1 min-w-[280px] bg-dark-800 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-center bg-gradient-to-br from-dark-800 to-yellow-900/10">
            <div className="text-center">
              <div className="text-5xl mb-3 animate-bounce">👑</div>
              <h3 className="font-black text-yellow-400 text-lg uppercase tracking-wider">Você é o Líder!</h3>
              <p className="text-gray-400 text-xs mt-1 max-w-[200px] mx-auto">Todos estão tentando alcançar você. Mantenha os acertos para garantir a taça!</p>
            </div>
          </div>
        )}

        {/* Ranking top 5 */}
        <div className="flex-1 min-w-[280px] bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">🏆 Ranking</h3>
            <button onClick={() => setActiveTab('ranking')} className="text-xs text-neon-green hover:underline">Ver completo →</button>
          </div>
          {top5.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">Nenhum dado ainda.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {top5.map((u, i) => {
                const isMe = u.id === loggedUser.id;
                const medals = ['🥇', '🥈', '🥉'];
                const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
                return (
                  <div key={u.id} className={`flex items-center gap-2 px-2 py-2 rounded-xl transition-all
                    ${isMe ? 'bg-neon-green/10 border border-neon-green/30' : 'hover:bg-dark-700'}`}>
                    <span className="w-6 text-center text-base flex-shrink-0">
                      {i < 3 ? medals[i] : <span className="text-xs text-gray-500 font-bold">{i + 1}º</span>}
                    </span>
                    <div className="flex-1 flex flex-col">
                        <span className={`text-sm font-semibold truncate ${isMe ? 'text-neon-green' : 'text-white'}`}>{name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded-full border border-yellow-400/20 font-bold">🎯 {u.cravadas || 0}</span>
                            <span className="text-[9px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full border border-neon-green/20 font-bold">✓ {u.acertos || 0}</span>
                            <span className="text-[10px] ml-1 font-black">
                                {u.trend === 'UP' && <span className="text-neon-green">↑</span>}
                                {u.trend === 'DOWN' && <span className="text-red-500">↓</span>}
                                {(!u.trend || u.trend === 'SAME') && <span className="text-dark-600">-</span>}
                            </span>
                        </div>
                    </div>
                    <span className={`text-sm font-black flex-shrink-0 ${isMe ? 'text-neon-green' : 'text-white'}`}>{u.total_points}<span className="text-xs text-gray-500 font-normal">pts</span></span>
                  </div>
                );
              })}
              {/* Minha posição se fora do top 5 */}
              {userRankPos >= 5 && userRankData && (
                <>
                  <div className="text-center text-gray-600 text-xs py-1">···</div>
                  <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30">
                    <span className="w-6 text-center text-xs text-neon-green font-black flex-shrink-0">{userRankPos + 1}º</span>
                    <div className="flex-1 flex flex-col">
                        <span className="text-sm font-semibold truncate text-neon-green">{firstName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded-full border border-yellow-400/20 font-bold">🎯 {userRankData.cravadas || 0}</span>
                            <span className="text-[9px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded-full border border-neon-green/20 font-bold">✓ {userRankData.acertos || 0}</span>
                            <span className="text-[10px] ml-1 font-black">
                                {userRankData.trend === 'UP' && <span className="text-neon-green">↑</span>}
                                {userRankData.trend === 'DOWN' && <span className="text-red-500">↓</span>}
                                {(!userRankData.trend || userRankData.trend === 'SAME') && <span className="text-dark-600">-</span>}
                            </span>
                        </div>
                    </div>
                    <span className="text-sm font-black text-neon-green flex-shrink-0">{myPoints}<span className="text-xs text-gray-500 font-normal">pts</span></span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
