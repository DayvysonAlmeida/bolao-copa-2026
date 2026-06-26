import { useState, useEffect } from 'react';
import { MatchRadarCard } from './comparator/MatchRadarCard';
import { CompactPrevMatch } from './comparator/CompactPrevMatch';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARATOR TAB — Radar de Palpites (Refatorado)
// ═══════════════════════════════════════════════════════════════════════════════
export function ComparatorTab({ matches, ranking, loggedUser, API_URL, accessToken }) {
    const [allBets, setAllBets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [nextMatchIndex, setNextMatchIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPrevIds, setExpandedPrevIds] = useState(new Set());

    useEffect(() => {
        if (!accessToken) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        fetch(`${API_URL}/bets/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(res => res.json())
        .then(data => {
            const betsArray = Array.isArray(data) ? data : (data.results || []);
            setAllBets(betsArray);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, [API_URL, accessToken]);

    // ── Organizar e encontrar os jogos ──────────────────────────────────────
    const sortedMatches = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    
    const finishedMatches = sortedMatches.filter(m => m.status === 'FINISHED');
    const prevMatches = finishedMatches.slice(-4).reverse();

    const currentMatchesRaw = sortedMatches.filter(m => m.status === 'IN_PROGRESS');
    const currentMatches = [];
    if (currentMatchesRaw.length > 0) {
        const currTimeMs = new Date(currentMatchesRaw[0].match_date).getTime();
        currentMatches.push(...currentMatchesRaw.filter(m => new Date(m.match_date).getTime() === currTimeMs));
    }

    const pendingMatches = sortedMatches.filter(m => m.status === 'PENDING');
    const nextMatches = [];
    if (pendingMatches.length > 0) {
        const nextTimeMs = new Date(pendingMatches[0].match_date).getTime();
        nextMatches.push(...pendingMatches.filter(m => new Date(m.match_date).getTime() === nextTimeMs));
    }

    // ── Tela de Login ───────────────────────────────────────────────────────
    if (!loggedUser) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center text-5xl mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-dark-700">🔒</div>
                <h2 className="text-3xl font-black text-white mb-3">Acesso Restrito</h2>
                <p className="text-gray-400 max-w-md text-center text-sm leading-relaxed">
                    Você precisa fazer <strong className="text-neon-green">Login</strong> para espionar os palpites dos outros participantes. Isso garante a privacidade e segurança do nosso bolão!
                </p>
            </div>
        );
    }

    // ── Tela de Loading ─────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-dark-700 border-t-neon-green rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Analisando o radar...</h3>
                <p className="text-gray-500 text-sm">Buscando palpites de todos os usuários</p>
            </div>
        );
    }

    const togglePrevExpand = (matchId) => {
        setExpandedPrevIds(prev => {
            const next = new Set(prev);
            if (next.has(matchId)) next.delete(matchId);
            else next.add(matchId);
            return next;
        });
    };

    return (
        <div className="max-w-[1400px] mx-auto animate-fadeIn pb-10">
            <div className="mb-5 sm:mb-8 bg-dark-800 border border-dark-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-2xl sm:text-3xl">🔍</span>
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">Radar de <span className="text-neon-green">Palpites</span></h2>
                        <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">Compare seus palpites com a galera</p>
                    </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-dark-900 border border-dark-700 rounded-xl sm:rounded-2xl flex flex-col items-center shadow-inner">
                        <span className="text-lg sm:text-xl font-black text-neon-green">{matches.filter(m => m.status === 'PENDING').length}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pendentes</span>
                    </div>
                    <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-dark-900 border border-dark-700 rounded-xl sm:rounded-2xl flex flex-col items-center shadow-inner">
                        <span className="text-lg sm:text-xl font-black text-blue-400">{ranking.length}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">Jogadores</span>
                    </div>
                    <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-dark-900 border border-dark-700 rounded-xl sm:rounded-2xl flex flex-col items-center shadow-inner">
                        <span className="text-lg sm:text-xl font-black text-yellow-400">{finishedMatches.length}</span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider">Encerrados</span>
                    </div>
                </div>
            </div>

            <div className="space-y-5 sm:space-y-8">
                {currentMatches.length > 0 && (
                    <MatchRadarCard 
                        match={currentMatches[currentMatchIndex >= currentMatches.length ? 0 : currentMatchIndex]}
                        title="Jogo Atual"
                        icon="⚡"
                        allBets={allBets}
                        loggedUser={loggedUser}
                        ranking={ranking}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        carouselControls={
                            currentMatches.length > 1 ? (
                                <div className="flex items-center gap-1.5 bg-neon-green/10 px-2 py-0.5 rounded-lg border border-neon-green/20 ml-2">
                                    <button onClick={() => setCurrentMatchIndex(p => p > 0 ? p - 1 : currentMatches.length - 1)} className="text-neon-green hover:text-white transition-colors">◀</button>
                                    <span className="text-[10px] text-neon-green font-bold">{currentMatchIndex >= currentMatches.length ? 1 : currentMatchIndex + 1}/{currentMatches.length}</span>
                                    <button onClick={() => setCurrentMatchIndex(p => p < currentMatches.length - 1 ? p + 1 : 0)} className="text-neon-green hover:text-white transition-colors">▶</button>
                                </div>
                            ) : null
                        }
                    />
                )}
                
                {nextMatches.length > 0 && (
                    <MatchRadarCard 
                        match={nextMatches[nextMatchIndex >= nextMatches.length ? 0 : nextMatchIndex]}
                        title="Próximo Jogo"
                        icon="⏭️"
                        allBets={allBets}
                        loggedUser={loggedUser}
                        ranking={ranking}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        carouselControls={
                            nextMatches.length > 1 ? (
                                <div className="flex items-center gap-1.5 bg-neon-green/10 px-2 py-0.5 rounded-lg border border-neon-green/20 ml-2">
                                    <button onClick={() => setNextMatchIndex(p => p > 0 ? p - 1 : nextMatches.length - 1)} className="text-neon-green hover:text-white transition-colors">◀</button>
                                    <span className="text-[10px] text-neon-green font-bold">{nextMatchIndex >= nextMatches.length ? 1 : nextMatchIndex + 1}/{nextMatches.length}</span>
                                    <button onClick={() => setNextMatchIndex(p => p < nextMatches.length - 1 ? p + 1 : 0)} className="text-neon-green hover:text-white transition-colors">▶</button>
                                </div>
                            ) : null
                        }
                    />
                )}
                
                {prevMatches.length > 0 && (
                    <div className="pt-5 sm:pt-8 mt-5 sm:mt-8 border-t border-dark-700/50">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-xl font-black text-gray-300 flex items-center gap-2 sm:gap-3">
                                <span className="text-lg sm:text-2xl">⏪</span> Últimos Resultados
                                <span className="text-[9px] sm:text-[10px] text-gray-500 bg-dark-800 px-2 py-0.5 rounded-full border border-dark-700 font-bold">{prevMatches.length} jogos</span>
                            </h3>
                            {prevMatches.length > 1 && (
                                <button 
                                    onClick={() => {
                                        if (expandedPrevIds.size === prevMatches.length) {
                                            setExpandedPrevIds(new Set());
                                        } else {
                                            setExpandedPrevIds(new Set(prevMatches.map(m => m.id)));
                                        }
                                    }}
                                    className="text-[10px] sm:text-xs text-gray-500 hover:text-neon-green transition-colors font-bold"
                                >
                                    {expandedPrevIds.size === prevMatches.length ? '▲ Recolher todos' : '▼ Expandir todos'}
                                </button>
                            )}
                        </div>
                        <div className="space-y-0">
                            {prevMatches.map(match => (
                                <CompactPrevMatch 
                                    key={match.id}
                                    match={match}
                                    allBets={allBets}
                                    loggedUser={loggedUser}
                                    expandedPrevIds={expandedPrevIds}
                                    togglePrevExpand={togglePrevExpand}
                                    ranking={ranking}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
