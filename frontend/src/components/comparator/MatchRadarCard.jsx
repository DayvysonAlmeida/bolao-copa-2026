import React from 'react';
import { DonutChart } from './DonutChart';

export function MatchRadarCard({ match, title, icon, carouselControls, allBets, loggedUser, ranking, searchQuery, setSearchQuery }) {
    if (!match) return null;

    const matchBets = allBets.filter(b => b.match === match.id);
    const myBet = matchBets.find(b => b.user === loggedUser?.id);

    let homeWins = 0, awayWins = 0, draws = 0;
    matchBets.forEach(b => {
        if (b.home_score > b.away_score) homeWins++;
        else if (b.away_score > b.home_score) awayWins++;
        else draws++;
    });

    const totalBets = homeWins + awayWins + draws || 1;
    const trendSlices = [
        { pct: (homeWins / totalBets) * 100, label: match.home_team_name, color: 'neon-green' },
        { pct: (draws / totalBets) * 100, label: 'Empate', color: 'yellow-400' },
        { pct: (awayWins / totalBets) * 100, label: match.away_team_name, color: 'blue-500' }
    ];

    const scoreMap = {};
    matchBets.forEach(b => {
        const key = `${b.home_score}×${b.away_score}`;
        scoreMap[key] = (scoreMap[key] || 0) + 1;
    });
    const sortedScores = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
    const topScore = sortedScores.length > 0 ? sortedScores[0] : null;
    const topScoreCount = topScore ? topScore[1] : 0;
    const topScorePct = topScore ? ((topScoreCount / matchBets.length) * 100).toFixed(0) : 0;

    const maxPct = Math.max((homeWins / totalBets) * 100, (awayWins / totalBets) * 100, (draws / totalBets) * 100);
    let consensusText, consensusColor, consensusBg;
    if (maxPct >= 70) {
        consensusText = 'Alta concordância';
        consensusColor = 'text-neon-green';
        consensusBg = 'bg-neon-green';
    } else if (maxPct >= 50) {
        consensusText = 'Concordância moderada';
        consensusColor = 'text-yellow-400';
        consensusBg = 'bg-yellow-400';
    } else {
        consensusText = 'Opiniões divididas';
        consensusColor = 'text-blue-400';
        consensusBg = 'bg-blue-400';
    }

    const otherBets = matchBets
        .filter(b => b.user !== loggedUser?.id)
        .sort((a, b) => {
            const rankA = ranking.findIndex(u => u.id === a.user);
            const rankB = ranking.findIndex(u => u.id === b.user);
            return (rankA === -1 ? 9999 : rankA) - (rankB === -1 ? 9999 : rankB);
        })
        .filter(bet => {
            if (!searchQuery?.trim()) return true;
            const userIdx = ranking.findIndex(u => u.id === bet.user);
            const user = userIdx !== -1 ? ranking[userIdx] : null;
            const name = user ? (user.first_name || user.username) : `Usuário ${bet.user}`;
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });

    return (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-8 mb-4 sm:mb-6 shadow-lg relative overflow-hidden group hover:border-dark-600 transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-8 pb-4 sm:pb-5 border-b border-dark-700/50 gap-3 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-dark-700 flex items-center justify-center text-lg sm:text-xl shadow-inner border border-dark-600 flex-shrink-0">
                        {icon}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-white text-base sm:text-lg uppercase tracking-wider">{title}</h3>
                        {carouselControls}
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-center gap-2 sm:gap-4 bg-dark-900/80 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-dark-700 shadow-inner w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                            {match.flag_home ? <img src={match.flag_home} alt="" className="w-6 h-4 sm:w-8 sm:h-6 object-cover rounded-md shadow-sm flex-shrink-0" /> : <span className="text-base sm:text-xl">🏴</span>}
                            <span className="font-bold text-gray-200 text-xs sm:text-sm truncate">{match.home_team_name}</span>
                        </div>
                        <span className="text-lg sm:text-2xl font-black text-white px-1 sm:px-2 flex-shrink-0">
                            {(match.status === 'FINISHED' || match.status === 'IN_PROGRESS') ? `${match.home_score ?? 0} × ${match.away_score ?? 0}` : '×'}
                        </span>
                        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                            <span className="font-bold text-gray-200 text-xs sm:text-sm truncate text-right">{match.away_team_name}</span>
                            {match.flag_away ? <img src={match.flag_away} alt="" className="w-6 h-4 sm:w-8 sm:h-6 object-cover rounded-md shadow-sm flex-shrink-0" /> : <span className="text-base sm:text-xl">🏴</span>}
                        </div>
                    </div>
                    <span className="text-gray-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 bg-dark-800 px-3 py-1 rounded-full border border-dark-700/80">
                        <span className="text-neon-green">🕒</span> 
                        {new Date(match.match_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 relative z-10">
                <div className="lg:col-span-4 xl:col-span-5 flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col bg-dark-900/40 rounded-2xl p-4 sm:p-6 border border-dark-700/50">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 sm:mb-6">Distribuição dos Palpites</h4>
                        
                        {matchBets.length > 0 ? (
                            <div className="flex flex-row sm:flex-row lg:flex-col xl:flex-row items-center gap-5 sm:gap-8 w-full justify-center">
                                <div className="w-24 h-24 sm:w-36 sm:h-36 flex-shrink-0 relative">
                                    <DonutChart slices={trendSlices} size={144} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase">Total</span>
                                        <span className="text-base sm:text-xl font-black text-white">{matchBets.length}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 sm:gap-3 w-full sm:max-w-[200px] lg:max-w-none xl:max-w-[200px]">
                                    <div className="flex justify-between items-center p-1.5 sm:p-2 rounded-lg bg-dark-800/50">
                                        <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-neon-green shadow-[0_0_8px_#04d361] flex-shrink-0"></span><span className="text-gray-300 font-semibold text-[11px] sm:text-sm truncate max-w-[70px] sm:max-w-[100px]">{match.home_team_name}</span></div>
                                        <span className="font-black text-white text-[11px] sm:text-sm">{((homeWins/totalBets)*100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-1.5 sm:p-2 rounded-lg bg-dark-800/50">
                                        <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] flex-shrink-0"></span><span className="text-gray-300 font-semibold text-[11px] sm:text-sm">Empate</span></div>
                                        <span className="font-black text-white text-[11px] sm:text-sm">{((draws/totalBets)*100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-1.5 sm:p-2 rounded-lg bg-dark-800/50">
                                        <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] flex-shrink-0"></span><span className="text-gray-300 font-semibold text-[11px] sm:text-sm truncate max-w-[70px] sm:max-w-[100px]">{match.away_team_name}</span></div>
                                        <span className="font-black text-white text-[11px] sm:text-sm">{((awayWins/totalBets)*100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-50 py-10">
                                <span className="text-3xl mb-2">👻</span>
                                <p className="text-gray-400 text-sm">Ninguém palpitou ainda.</p>
                            </div>
                        )}
                    </div>

                    {matchBets.length > 0 && (
                        <div className="bg-dark-900/40 rounded-2xl p-3 sm:p-4 border border-dark-700/50 flex flex-col gap-3">
                            {topScore && (
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                        <span className="text-sm">🔥</span>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Favorito</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-xs sm:text-sm font-black text-white bg-dark-800 px-2 sm:px-3 py-1 rounded-lg border border-dark-700">{topScore[0]}</span>
                                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold">{topScoreCount} {topScoreCount === 1 ? 'voto' : 'votos'} ({topScorePct}%)</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="text-sm">📊</span>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Consenso</span>
                                    </div>
                                    <span className={`text-[9px] sm:text-[10px] font-bold ${consensusColor}`}>{consensusText}</span>
                                </div>
                                <div className="w-full h-1.5 bg-dark-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${consensusBg} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${maxPct}%` }}></div>
                                </div>
                            </div>

                            {sortedScores.length > 1 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {sortedScores.slice(0, 4).map(([score, count], i) => (
                                        <span key={score} className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border font-bold ${i === 0 ? 'bg-neon-green/10 border-neon-green/30 text-neon-green' : 'bg-dark-800 border-dark-700 text-gray-400'}`}>
                                            {score} ({count})
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-8 xl:col-span-7 flex flex-col h-full min-h-[260px] sm:min-h-[300px]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Palpites da Galera</h4>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {matchBets.length > 3 && (
                                <div className="relative flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        placeholder="Buscar jogador..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                                        className="w-full sm:w-40 bg-dark-900 border border-dark-700 text-gray-300 text-[11px] rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-neon-green/50 placeholder-gray-600 transition-colors"
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 text-[11px]">🔍</span>
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery && setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 text-xs transition-colors">✕</button>
                                    )}
                                </div>
                            )}
                            {matchBets.length > 0 && <span className="text-[10px] bg-dark-700 text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">{matchBets.length} palpites</span>}
                        </div>
                    </div>
                    
                    {myBet && (() => {
                        let isExact = false;
                        let isWinner = false;
                        let isWrong = false;

                        if (match.status === 'FINISHED' || match.status === 'IN_PROGRESS') {
                            isExact = match.home_score === myBet.home_score && match.away_score === myBet.away_score;
                            const homeWin = match.home_score > match.away_score;
                            const awayWin = match.away_score > match.home_score;
                            const betHomeWin = myBet.home_score > myBet.away_score;
                            const betAwayWin = myBet.away_score > myBet.home_score;
                            const betDraw = myBet.home_score === myBet.away_score;
                            isWinner = !isExact && ((homeWin && betHomeWin) || (awayWin && betAwayWin) || (!homeWin && !awayWin && betDraw));
                            isWrong = !isExact && !isWinner;
                        }

                        const isPlayedOrLive = match.status === 'FINISHED' || match.status === 'IN_PROGRESS';
                        const isPending = match.status === 'PENDING';
                        const isCurrentWrong = isWrong && isPlayedOrLive;
                        
                        const myBorderColor = isCurrentWrong ? 'border-red-500' : isExact ? 'border-yellow-400' : isWinner ? 'border-neon-green' : 'border-dark-700';
                        const myBgColor = isCurrentWrong ? 'bg-red-500/10' : isExact ? 'bg-yellow-400/10' : isWinner ? 'bg-neon-green/10' : 'bg-dark-800/50';
                        const myShadow = isCurrentWrong ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' : isExact ? 'shadow-[0_0_15px_rgba(250,204,21,0.15)]' : isWinner ? 'shadow-[0_0_15px_rgba(4,211,97,0.15)]' : 'shadow-none';
                        const myTextColor = isCurrentWrong ? 'text-red-500' : isExact ? 'text-yellow-400' : isWinner ? 'text-neon-green' : 'text-gray-300';
                        const myCircleBg = isCurrentWrong ? 'bg-red-500 text-white' : isExact ? 'bg-yellow-400 text-dark-900' : isWinner ? 'bg-neon-green text-dark-900' : 'bg-dark-700 text-gray-400 border border-dark-600';
                        const emoji = isExact ? '🎯' : (isWinner ? '✓' : (isCurrentWrong ? '❌' : '👤'));

                        return (
                            <div className={`mb-3 flex items-center justify-between p-3 sm:p-3.5 rounded-xl border-2 ${myBorderColor} ${myBgColor} ${myShadow} transform hover:scale-[1.01] transition-transform`}>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${myCircleBg} flex items-center justify-center font-black text-xs sm:text-sm shadow-inner flex-shrink-0`}>
                                        {emoji}
                                    </div>
                                    <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${isPending ? 'text-gray-400' : 'text-white'}`}>Seu Palpite</span>
                                </div>
                                <span className={`text-xl sm:text-2xl font-black ${myTextColor} tracking-widest drop-shadow-md`}>
                                    {myBet.home_score} <span className={`${myTextColor}/50 text-lg sm:text-xl font-medium`}>×</span> {myBet.away_score}
                                </span>
                            </div>
                        );
                    })()}

                    <div className="flex-1 bg-dark-900/50 rounded-2xl border border-dark-700/50 overflow-hidden flex flex-col max-h-[320px]">
                        <div className="overflow-y-auto p-2 sm:p-2.5 custom-scrollbar flex flex-col gap-1 sm:gap-1.5 h-full">
                            {otherBets.map(bet => {
                                const userIndex = ranking.findIndex(u => u.id === bet.user);
                                const user = userIndex !== -1 ? ranking[userIndex] : null;
                                const userName = user ? (user.first_name || user.username) : `Usuário ${bet.user}`;
                                const userInitials = userName.substring(0, 2).toUpperCase();
                                
                                let medal = '';
                                if (userIndex === 0) medal = '🥇';
                                else if (userIndex === 1) medal = '🥈';
                                else if (userIndex === 2) medal = '🥉';
                                
                                let isExact = false;
                                let isWinner = false;
                                let isWrong = false;
                                if (match.status === 'FINISHED' || match.status === 'IN_PROGRESS') {
                                    isExact = match.home_score === bet.home_score && match.away_score === bet.away_score;
                                    const homeWin = match.home_score > match.away_score;
                                    const awayWin = match.away_score > match.home_score;
                                    const betHomeWin = bet.home_score > bet.away_score;
                                    const betAwayWin = bet.away_score > bet.home_score;
                                    const betDraw = bet.home_score === bet.away_score;
                                    isWinner = !isExact && ((homeWin && betHomeWin) || (awayWin && betAwayWin) || (!homeWin && !awayWin && betDraw));
                                    isWrong = !isExact && !isWinner;
                                }

                                const isPlayedOrLive = match.status === 'FINISHED' || match.status === 'IN_PROGRESS';
                                const userIsWrong = isWrong && isPlayedOrLive;
                                
                                const userBorderClass = isExact ? 'border-yellow-400/40 bg-yellow-400/10' : isWinner ? 'border-neon-green/40 bg-neon-green/10' : userIsWrong ? 'border-red-500/30 bg-red-500/5' : 'border-dark-700/50 bg-dark-800/30';
                                const userTextClass = isExact ? 'text-yellow-400' : isWinner ? 'text-neon-green' : userIsWrong ? 'text-red-400/80' : 'text-gray-300';
                                const userXClass = isExact ? 'text-yellow-400/50' : isWinner ? 'text-neon-green/50' : userIsWrong ? 'text-red-400/50' : 'text-gray-600';

                                return (
                                    <div key={bet.id} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-colors hover:bg-dark-800 ${userBorderClass}`}>
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <div className="relative flex-shrink-0">
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-dark-700 flex items-center justify-center text-gray-300 font-bold text-[9px] sm:text-[10px] border border-dark-600">
                                                    {userInitials}
                                                </div>
                                                {medal && (
                                                    <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 text-[12px] sm:text-[14px] drop-shadow-md">
                                                        {medal}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    <span className="font-semibold text-gray-200 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[180px]">{userName}</span>
                                                    {isExact && <span className="text-[9px] sm:text-[10px] bg-yellow-400 text-yellow-950 px-1.5 sm:px-2.5 py-0.5 rounded-full font-black shadow-[0_0_8px_rgba(250,204,21,0.4)]">EXATO</span>}
                                                    {isWinner && <span className="text-[9px] sm:text-[10px] bg-neon-green/20 border border-neon-green/50 text-neon-green px-1.5 sm:px-2 py-0.5 rounded-full font-bold">Acerto</span>}
                                                    {userIsWrong && <span className="text-[9px] sm:text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-1.5 sm:px-2 py-0.5 rounded-full font-bold">Erro</span>}
                                                </div>
                                                {user && (
                                                    <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
                                                        <span className="text-[8px] sm:text-[9px] bg-yellow-400/10 text-yellow-500 px-1 sm:px-1.5 py-0.5 rounded-full border border-yellow-400/20" title="Placares Exatos">🎯 {user.cravadas || 0}</span>
                                                        <span className="text-[8px] sm:text-[9px] bg-neon-green/10 text-neon-green px-1 sm:px-1.5 py-0.5 rounded-full border border-neon-green/20" title="Acertos de Tendência">✓ {user.acertos || 0}</span>
                                                        <span className="text-[9px] sm:text-[10px] ml-0.5 sm:ml-1 font-black">
                                                            {user.trend === 'UP' && <span className="text-neon-green" title="Subiu no ranking">↑</span>}
                                                            {user.trend === 'DOWN' && <span className="text-red-500" title="Desceu no ranking">↓</span>}
                                                            {(!user.trend || user.trend === 'SAME') && <span className="text-dark-600" title="Manteve">-</span>}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-lg sm:text-xl font-black tracking-widest ${userTextClass} flex-shrink-0 ml-2`}>
                                            {bet.home_score} <span className={`font-normal ${userXClass}`}>×</span> {bet.away_score}
                                        </span>
                                    </div>
                                )
                            })}
                            {otherBets.length === 0 && searchQuery?.trim() && (
                                <div className="flex-1 flex flex-col items-center justify-center h-24 text-sm text-gray-500">
                                    <span className="text-2xl mb-2">🔎</span>
                                    <p className="italic">Nenhum jogador encontrado para "<span className="text-gray-300">{searchQuery}</span>"</p>
                                </div>
                            )}
                            {matchBets.length <= (myBet ? 1 : 0) && !searchQuery?.trim() && (
                                <div className="flex-1 flex items-center justify-center h-24 text-sm text-gray-500 italic">
                                    Seja o pioneiro! Ninguém mais palpitou aqui.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
