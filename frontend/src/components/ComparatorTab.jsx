import { useState, useEffect } from 'react';

// Reuse DonutChart for the distribution visualization
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

export function ComparatorTab({ matches, ranking, loggedUser, API_URL, accessToken }) {
    const [allBets, setAllBets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    // Organizar e encontrar os 3 jogos
    const sortedMatches = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    
    // Jogo Anterior: o último finalizado
    const finishedMatches = sortedMatches.filter(m => m.status === 'FINISHED');
    const prevMatch = finishedMatches.length > 0 ? finishedMatches[finishedMatches.length - 1] : null;

    // Jogo Atual: SOMENTE se estiver IN_PROGRESS
    let currentMatch = sortedMatches.find(m => m.status === 'IN_PROGRESS') || null;

    // Próximo Jogo: o primeiro PENDING
    const pendingMatches = sortedMatches.filter(m => m.status === 'PENDING');
    let nextMatch = pendingMatches.length > 0 ? pendingMatches[0] : null;

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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-dark-700 border-t-neon-green rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Analisando o radar...</h3>
                <p className="text-gray-500 text-sm">Buscando palpites de todos os usuários</p>
            </div>
        );
    }

    const renderMatchRadar = (match, title, icon) => {
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

        return (
            <div className="bg-dark-800 border border-dark-700 rounded-3xl p-5 md:p-8 mb-6 shadow-lg relative overflow-hidden group hover:border-dark-600 transition-colors">
                {/* Background Decorativo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Header do Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-dark-700/50 gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-xl shadow-inner border border-dark-600">
                            {icon}
                        </div>
                        <h3 className="font-black text-white text-lg uppercase tracking-wider">{title}</h3>
                    </div>
                    
                    <div className="flex items-center justify-center gap-4 bg-dark-900/80 px-6 py-3 rounded-2xl border border-dark-700 shadow-inner">
                        <div className="flex items-center gap-3 w-28">
                            {match.flag_home ? <img src={match.flag_home} alt="" className="w-8 h-6 object-cover rounded-md shadow-sm" /> : <span className="text-xl">🏴</span>}
                            <span className="font-bold text-gray-200 text-sm truncate">{match.home_team_name}</span>
                        </div>
                        <span className="text-2xl font-black text-white px-2">
                            {(match.status === 'FINISHED' || match.status === 'IN_PROGRESS') ? `${match.home_score} × ${match.away_score}` : '×'}
                        </span>
                        <div className="flex items-center justify-end gap-3 w-28">
                            <span className="font-bold text-gray-200 text-sm truncate text-right">{match.away_team_name}</span>
                            {match.flag_away ? <img src={match.flag_away} alt="" className="w-8 h-6 object-cover rounded-md shadow-sm" /> : <span className="text-xl">🏴</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                    
                    {/* Gráfico de Distribuição */}
                    <div className="lg:col-span-4 xl:col-span-5 flex flex-col bg-dark-900/40 rounded-2xl p-6 border border-dark-700/50">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Distribuição dos Palpites</h4>
                        
                        {matchBets.length > 0 ? (
                            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-8 w-full justify-center">
                                <div className="w-36 h-36 flex-shrink-0 relative">
                                    <DonutChart slices={trendSlices} size={144} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xs text-gray-500 font-bold uppercase">Total</span>
                                        <span className="text-xl font-black text-white">{matchBets.length}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 w-full sm:max-w-[200px] lg:max-w-none xl:max-w-[200px]">
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-dark-800/50">
                                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-neon-green shadow-[0_0_8px_#04d361]"></span><span className="text-gray-300 font-semibold text-sm truncate max-w-[100px]">{match.home_team_name}</span></div>
                                        <span className="font-black text-white text-sm">{((homeWins/totalBets)*100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-dark-800/50">
                                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]"></span><span className="text-gray-300 font-semibold text-sm">Empate</span></div>
                                        <span className="font-black text-white text-sm">{((draws/totalBets)*100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-dark-800/50">
                                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span><span className="text-gray-300 font-semibold text-sm truncate max-w-[100px]">{match.away_team_name}</span></div>
                                        <span className="font-black text-white text-sm">{((awayWins/totalBets)*100).toFixed(0)}%</span>
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

                    {/* Lista Rolável de Palpites */}
                    <div className="lg:col-span-8 xl:col-span-7 flex flex-col h-full min-h-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Palpites da Galera</h4>
                            {matchBets.length > 0 && <span className="text-[10px] bg-dark-700 text-gray-400 px-2 py-0.5 rounded-full">{matchBets.length} palpites</span>}
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
                                <div className={`mb-3 flex items-center justify-between p-3.5 rounded-xl border-2 ${myBorderColor} ${myBgColor} ${myShadow} transform hover:scale-[1.01] transition-transform`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${myCircleBg} flex items-center justify-center font-black text-sm shadow-inner`}>
                                            {emoji}
                                        </div>
                                        <span className={`font-black text-sm uppercase tracking-wider ${isPending ? 'text-gray-400' : 'text-white'}`}>Seu Palpite</span>
                                    </div>
                                    <span className={`text-2xl font-black ${myTextColor} tracking-widest drop-shadow-md`}>
                                        {myBet.home_score} <span className={`${myTextColor}/50 text-xl font-medium`}>×</span> {myBet.away_score}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Lista com scroll */}
                        <div className="flex-1 bg-dark-900/50 rounded-2xl border border-dark-700/50 overflow-hidden flex flex-col max-h-[320px]">
                            <div className="overflow-y-auto p-2.5 custom-scrollbar flex flex-col gap-1.5 h-full">
                                {matchBets.filter(b => b.user !== loggedUser?.id).map(bet => {
                                    const user = ranking.find(u => u.id === bet.user);
                                    const userName = user ? (user.first_name || user.username) : `Usuário ${bet.user}`;
                                    const userInitials = userName.substring(0, 2).toUpperCase();
                                    
                                    // Highlight logic if match is done/live
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
                                        <div key={bet.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-dark-800 ${userBorderClass}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-gray-300 font-bold text-[10px] border border-dark-600">
                                                    {userInitials}
                                                </div>
                                                <span className="font-semibold text-gray-200 text-sm truncate max-w-[100px] sm:max-w-[180px] lg:max-w-[120px] xl:max-w-[180px]">{userName}</span>
                                                {isExact && <span className="text-[10px] bg-yellow-400 text-yellow-950 px-2.5 py-0.5 rounded-full font-black shadow-[0_0_8px_rgba(250,204,21,0.4)]">EXATO</span>}
                                                {isWinner && <span className="text-[10px] bg-neon-green/20 border border-neon-green/50 text-neon-green px-2 py-0.5 rounded-full font-bold">Acerto</span>}
                                                {userIsWrong && <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full font-bold">Erro</span>}
                                            </div>
                                            <span className={`text-xl font-black tracking-widest ${userTextClass}`}>
                                                {bet.home_score} <span className={`font-normal ${userXClass}`}>×</span> {bet.away_score}
                                            </span>
                                        </div>
                                    )
                                })}
                                {matchBets.length <= (myBet ? 1 : 0) && (
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

    return (
        <div className="max-w-[1400px] mx-auto animate-fadeIn pb-10">
            <div className="mb-8 bg-dark-800 border border-dark-700 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🔍</span>
                        <h2 className="text-3xl font-black text-white tracking-tight">Radar de <span className="text-neon-green">Palpites</span></h2>
                    </div>
                    <p className="text-gray-400 text-sm max-w-2xl">Aqui você tem a visão completa! Compare o seu palpite com o restante da galera para o jogo que acabou de terminar, o jogo de agora e o próximo.</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-dark-900 border border-dark-700 rounded-full text-xs font-bold text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neon-green"></span> Ao vivo</span>
                    <span className="px-3 py-1 bg-dark-900 border border-dark-700 rounded-full text-xs font-bold text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Finalizados</span>
                </div>
            </div>

            <div className="space-y-8">
                {renderMatchRadar(currentMatch, "Jogo Atual", "⚡")}
                {renderMatchRadar(nextMatch, "Próximo Jogo", "⏭️")}
                {renderMatchRadar(prevMatch, "Jogo Anterior", "⏪")}
            </div>
        </div>
    );
}
