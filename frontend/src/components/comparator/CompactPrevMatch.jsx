import React from 'react';
import { MatchRadarCard } from './MatchRadarCard';

export function CompactPrevMatch({ match, allBets, loggedUser, expandedPrevIds, togglePrevExpand, ranking, searchQuery, setSearchQuery }) {
    const matchBets = allBets.filter(b => b.match === match.id);
    const myBet = matchBets.find(b => b.user === loggedUser?.id);
    const isExpanded = expandedPrevIds.has(match.id);
    
    const calcMyResult = (match, myBet) => {
        if (!myBet) return null;
        if (match.status !== 'FINISHED' && match.status !== 'IN_PROGRESS') return null;

        const isExact = match.home_score === myBet.home_score && match.away_score === myBet.away_score;
        const homeWin = match.home_score > match.away_score;
        const awayWin = match.away_score > match.home_score;
        const betHomeWin = myBet.home_score > myBet.away_score;
        const betAwayWin = myBet.away_score > myBet.home_score;
        const betDraw = myBet.home_score === myBet.away_score;
        const isWinner = !isExact && ((homeWin && betHomeWin) || (awayWin && betAwayWin) || (!homeWin && !awayWin && betDraw));

        if (isExact) return { label: 'CRAVOU', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', emoji: '🎯' };
        if (isWinner) return { label: 'Acertou', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green/30', emoji: '✓' };
        return { label: 'Errou', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', emoji: '❌' };
    };

    const myResult = calcMyResult(match, myBet);

    return (
        <div className="mb-2">
            <button
                onClick={() => togglePrevExpand(match.id)}
                className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-dark-800 border transition-all hover:border-dark-600 cursor-pointer ${isExpanded ? 'border-dark-600 rounded-b-none' : 'border-dark-700'}`}
            >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-base sm:text-lg flex-shrink-0">🏁</span>
                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                            {match.flag_home ? <img src={match.flag_home} alt="" className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover rounded-sm flex-shrink-0" /> : <span className="text-sm">🏴</span>}
                            <span className="text-[11px] sm:text-xs font-bold text-gray-300 truncate max-w-[45px] sm:max-w-none">{match.home_team_name}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-white flex-shrink-0">{match.home_score} × {match.away_score}</span>
                        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                            <span className="text-[11px] sm:text-xs font-bold text-gray-300 truncate max-w-[45px] sm:max-w-none">{match.away_team_name}</span>
                            {match.flag_away ? <img src={match.flag_away} alt="" className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover rounded-sm flex-shrink-0" /> : <span className="text-sm">🏴</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-2">
                    {myResult && (
                        <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border font-bold ${myResult.bg} ${myResult.color}`}>
                            {myResult.emoji} {myResult.label}
                        </span>
                    )}
                    {myBet && (
                        <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:inline">Seu: {myBet.home_score}×{myBet.away_score}</span>
                    )}
                    <span className="text-[9px] sm:text-[10px] text-gray-500 bg-dark-900 px-1.5 sm:px-2 py-0.5 rounded-full hidden sm:inline">{matchBets.length} palp.</span>
                    <span className={`text-gray-500 text-[10px] sm:text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </button>
            
            {isExpanded && (
                <div className="border border-t-0 border-dark-600 rounded-b-2xl overflow-hidden">
                    <MatchRadarCard 
                        match={match} 
                        title="Jogo Encerrado" 
                        icon="🏁"
                        allBets={allBets}
                        loggedUser={loggedUser}
                        ranking={ranking}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </div>
            )}
        </div>
    );
}
