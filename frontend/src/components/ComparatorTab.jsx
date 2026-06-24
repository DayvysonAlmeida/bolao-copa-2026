import { useState, useEffect } from 'react';

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 100 }) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARATOR TAB — Radar de Palpites
// ═══════════════════════════════════════════════════════════════════════════════
export function ComparatorTab({ matches, ranking, loggedUser, API_URL, accessToken }) {
    const [allBets, setAllBets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [nextMatchIndex, setNextMatchIndex] = useState(0);
    // ✨ NOVO: Busca por jogador
    const [searchQuery, setSearchQuery] = useState('');
    // ✨ NOVO: Cards colapsáveis para jogos encerrados
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

    // ── Toggle para expandir/colapsar jogos encerrados ──────────────────────
    const togglePrevExpand = (matchId) => {
        setExpandedPrevIds(prev => {
            const next = new Set(prev);
            if (next.has(matchId)) next.delete(matchId);
            else next.add(matchId);
            return next;
        });
    };

    // ── Função auxiliar para calcular resultado do meu palpite ──────────────
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

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER MATCH RADAR — Card principal com todas as melhorias
    // ═════════════════════════════════════════════════════════════════════════
    const renderMatchRadar = (match, title, icon, carouselControls = null) => {
        if (!match) return null;

        const matchBets = allBets.filter(b => b.match === match.id);
        const myBet = matchBets.find(b => b.user === loggedUser.id);

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

        // ✨ NOVO: Placar mais votado
        const scoreMap = {};
        matchBets.forEach(b => {
            const key = `${b.home_score}×${b.away_score}`;
            scoreMap[key] = (scoreMap[key] || 0) + 1;
        });
        const sortedScores = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
        const topScore = sortedScores.length > 0 ? sortedScores[0] : null;
        const topScoreCount = topScore ? topScore[1] : 0;
        const topScorePct = topScore ? ((topScoreCount / matchBets.length) * 100).toFixed(0) : 0;

        // ✨ NOVO: Nível de consenso
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

        // ✨ NOVO: Filtrar palpites pela busca
        const otherBets = matchBets
            .filter(b => b.user !== loggedUser?.id)
            .sort((a, b) => {
                const rankA = ranking.findIndex(u => u.id === a.user);
                const rankB = ranking.findIndex(u => u.id === b.user);
                return (rankA === -1 ? 9999 : rankA) - (rankB === -1 ? 9999 : rankB);
            })
            .filter(bet => {
                if (!searchQuery.trim()) return true;
                const userIdx = ranking.findIndex(u => u.id === bet.user);
                const user = userIdx !== -1 ? ranking[userIdx] : null;
                const name = user ? (user.first_name || user.username) : `Usuário ${bet.user}`;
                return name.toLowerCase().includes(searchQuery.toLowerCase());
            });

        return (
            <div className="bg-dark-800 border border-dark-700 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-8 mb-4 sm:mb-6 shadow-lg relative overflow-hidden group hover:border-dark-600 transition-colors">
                {/* Background Decorativo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* ✨ MELHORIA 1: Header compacto */}
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
                    
                    {/* Coluna esquerda: Gráfico + Insights */}
                    <div className="lg:col-span-4 xl:col-span-5 flex flex-col gap-3 sm:gap-4">
                        {/* Gráfico de Distribuição */}
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

                        {/* ✨ MELHORIA 4 & 5: Placar mais votado + Indicador de consenso */}
                        {matchBets.length > 0 && (
                            <div className="bg-dark-900/40 rounded-2xl p-3 sm:p-4 border border-dark-700/50 flex flex-col gap-3">
                                {/* Placar favorito */}
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
                                
                                {/* Nível de consenso */}
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

                                {/* Top 3 placares mais apostados */}
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

                    {/* Coluna direita: Lista Rolável de Palpites */}
                    <div className="lg:col-span-8 xl:col-span-7 flex flex-col h-full min-h-[260px] sm:min-h-[300px]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Palpites da Galera</h4>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {/* ✨ MELHORIA 3: Campo de busca */}
                                {matchBets.length > 3 && (
                                    <div className="relative flex-1 sm:flex-initial">
                                        <input
                                            type="text"
                                            placeholder="Buscar jogador..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full sm:w-40 bg-dark-900 border border-dark-700 text-gray-300 text-[11px] rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-neon-green/50 placeholder-gray-600 transition-colors"
                                        />
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 text-[11px]">🔍</span>
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 text-xs transition-colors">✕</button>
                                        )}
                                    </div>
                                )}
                                {matchBets.length > 0 && <span className="text-[10px] bg-dark-700 text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">{matchBets.length} palpites</span>}
                            </div>
                        </div>
                        
                        {/* Meu palpite fixo no topo */}
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

                        {/* Lista com scroll */}
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
                                        // ✨ MELHORIA 6: Melhor layout mobile
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
                                {/* Mensagem de busca sem resultado */}
                                {otherBets.length === 0 && searchQuery.trim() && (
                                    <div className="flex-1 flex flex-col items-center justify-center h-24 text-sm text-gray-500">
                                        <span className="text-2xl mb-2">🔎</span>
                                        <p className="italic">Nenhum jogador encontrado para "<span className="text-gray-300">{searchQuery}</span>"</p>
                                    </div>
                                )}
                                {matchBets.length <= (myBet ? 1 : 0) && !searchQuery.trim() && (
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
    };

    // ═════════════════════════════════════════════════════════════════════════
    // ✨ MELHORIA 2: Card compacto/colapsável para jogos encerrados
    // ═════════════════════════════════════════════════════════════════════════
    const renderCompactPrevMatch = (match) => {
        const matchBets = allBets.filter(b => b.match === match.id);
        const myBet = matchBets.find(b => b.user === loggedUser.id);
        const isExpanded = expandedPrevIds.has(match.id);
        const myResult = calcMyResult(match, myBet);

        return (
            <div key={match.id} className="mb-2">
                {/* Linha compacta — sempre visível */}
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
                
                {/* Conteúdo expandido */}
                {isExpanded && (
                    <div className="border border-t-0 border-dark-600 rounded-b-2xl overflow-hidden">
                        {renderMatchRadar(match, 'Jogo Encerrado', '🏁')}
                    </div>
                )}
            </div>
        );
    };

    // ═════════════════════════════════════════════════════════════════════════
    // RENDER PRINCIPAL
    // ═════════════════════════════════════════════════════════════════════════
    return (
        <div className="max-w-[1400px] mx-auto animate-fadeIn pb-10">
            {/* ✨ MELHORIA 1: Header compacto */}
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
                {/* Jogos ao vivo */}
                {currentMatches.length > 0 && renderMatchRadar(
                    currentMatches[currentMatchIndex >= currentMatches.length ? 0 : currentMatchIndex], 
                    "Jogo Atual", 
                    "⚡",
                    currentMatches.length > 1 ? (
                        <div className="flex items-center gap-1.5 bg-neon-green/10 px-2 py-0.5 rounded-lg border border-neon-green/20 ml-2">
                            <button onClick={() => setCurrentMatchIndex(p => p > 0 ? p - 1 : currentMatches.length - 1)} className="text-neon-green hover:text-white transition-colors">◀</button>
                            <span className="text-[10px] text-neon-green font-bold">{currentMatchIndex >= currentMatches.length ? 1 : currentMatchIndex + 1}/{currentMatches.length}</span>
                            <button onClick={() => setCurrentMatchIndex(p => p < currentMatches.length - 1 ? p + 1 : 0)} className="text-neon-green hover:text-white transition-colors">▶</button>
                        </div>
                    ) : null
                )}
                
                {/* Próximos jogos */}
                {nextMatches.length > 0 && renderMatchRadar(
                    nextMatches[nextMatchIndex >= nextMatches.length ? 0 : nextMatchIndex], 
                    "Próximo Jogo", 
                    "⏭️",
                    nextMatches.length > 1 ? (
                        <div className="flex items-center gap-1.5 bg-neon-green/10 px-2 py-0.5 rounded-lg border border-neon-green/20 ml-2">
                            <button onClick={() => setNextMatchIndex(p => p > 0 ? p - 1 : nextMatches.length - 1)} className="text-neon-green hover:text-white transition-colors">◀</button>
                            <span className="text-[10px] text-neon-green font-bold">{nextMatchIndex >= nextMatches.length ? 1 : nextMatchIndex + 1}/{nextMatches.length}</span>
                            <button onClick={() => setNextMatchIndex(p => p < nextMatches.length - 1 ? p + 1 : 0)} className="text-neon-green hover:text-white transition-colors">▶</button>
                        </div>
                    ) : null
                )}
                
                {/* ✨ MELHORIA 2: Jogos encerrados com cards colapsáveis */}
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
                            {prevMatches.map(match => renderCompactPrevMatch(match))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
