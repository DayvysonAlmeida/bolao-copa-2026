import { useState, useMemo, useEffect, Component } from 'react';

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("DashboardErrorBoundary caught an error", error, info);
    this.setState({ error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900/20 border border-red-500 rounded-xl m-4 text-white">
          <h2 className="text-xl font-bold text-red-400 mb-4">CRASH DO DASHBOARD:</h2>
          <pre className="text-xs bg-dark-900 p-4 rounded overflow-auto">{this.state.error && this.state.error.toString()}</pre>
          <pre className="text-[10px] text-gray-400 mt-4 overflow-auto">{this.state.info && this.state.info.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}


// ─── Gráfico de linha SVG ─────────────────────────────────────────────────────
function LineChart({ labels, series }) {
  const W = 520, H = 160, PX = 40, PY = 14;
  const iW = W - PX * 2, iH = H - PY * 2;
  const allVals = series.flatMap(s => s.data);
  if (!allVals.length) return null;
  const minV = Math.max(0, Math.min(...allVals) - 5);
  const maxV = Math.max(...allVals) + 5;
  const toX = i => PX + (i / Math.max(labels.length - 1, 1)) * iW;
  const toY = v => PY + iH - ((v - minV) / Math.max(maxV - minV, 1)) * iH;
  const COLORS = ['#04d361', '#3b82f6', '#eab308', '#f87171', '#a78bfa'];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {[0, 0.33, 0.66, 1].map((t, i) => {
        const y = PY + t * iH;
        return (
          <g key={i}>
            <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#29292e" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PX - 4} y={y + 4} textAnchor="end" fontSize="8" fill="#4b5563">{Math.round(maxV - t * (maxV - minV))}</text>
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={toX(i)} y={H - 2} textAnchor="middle" fontSize="8" fill="#4b5563">{l}</text>
      ))}
      {series.map((s, si) => {
        // Deslocamento visual (si * 2) para evitar que linhas com pontuação idêntica se sobreponham totalmente
        const offset = si * 2;
        const pts = s.data.map((v, i) => `${toX(i)},${toY(v) - offset}`).join(' ');
        const color = COLORS[si % COLORS.length];
        return (
          <g key={si}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
            {s.data.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v) - offset} r="3.5" fill={color} stroke="#121214" strokeWidth="1.5" />)}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gráfico de rosca SVG ─────────────────────────────────────────────────────
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
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={COLORS[i % COLORS.length]} strokeWidth={size * 0.16}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ─── Card de jogo compacto ────────────────────────────────────────────────────
function MatchRow({ match, userBet, onClick, showBet = false }) {
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
        {showBet && userBet && (
          <span className="text-[9px] text-neon-green/80 mt-0.5">Palpite: {userBet.home_score}×{userBet.away_score}</span>
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'neon-green', highlight = false }) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PÚBLICO (visitante)
// ═══════════════════════════════════════════════════════════════════════════════
function PublicDashboard({ ranking, matches, setActiveTab, setShowLoginModal, stats }) {
  const [selectedGroup, setSelectedGroup] = useState('A');

  const liveMatches = matches.filter(m => m.status === 'IN_PROGRESS');
  const finishedMatchesAll = matches.filter(m => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
  const finishedMatches = finishedMatchesAll.slice(0, 5);
  const upcomingMatches = matches.filter(m => m.status === 'PENDING')
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date))
    .slice(0, 4);

  // Tendências e Goleada
  let homeWins = 0, awayWins = 0, draws = 0;
  let maxGoalsMatch = null, maxGoals = -1;
  finishedMatchesAll.forEach(m => {
    if (m.home_score > m.away_score) homeWins++;
    else if (m.home_score < m.away_score) awayWins++;
    else draws++;
    const tg = m.home_score + m.away_score;
    if (tg > maxGoals) { maxGoals = tg; maxGoalsMatch = m; }
  });
  const totalFinishedTrend = homeWins + awayWins + draws || 1;
  const trendSlices = [
    { pct: (homeWins / totalFinishedTrend) * 100, label: 'Casa' },
    { pct: (draws / totalFinishedTrend) * 100, label: 'Empate' },
    { pct: (awayWins / totalFinishedTrend) * 100, label: 'Fora' }
  ];
  const top5 = ranking.slice(0, 5);
  const groups = [...new Set(matches.map(m => m.group).filter(Boolean))].sort();

  // Inicializa grupo selecionado com o primeiro disponível
  const activeGroup = groups.includes(selectedGroup) ? selectedGroup : (groups[0] || 'A');
  const groupMatchesDone = matches.filter(m => m.group === activeGroup && (m.status === 'FINISHED' || m.status === 'IN_PROGRESS'));

  // Classificação do grupo selecionado
  const groupTable = useMemo(() => {
    const teams = {};
    matches.filter(m => m.group === activeGroup).forEach(m => {
      if (!teams[m.home_team_name]) teams[m.home_team_name] = { flag: m.flag_home, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, PTS: 0 };
      if (!teams[m.away_team_name]) teams[m.away_team_name] = { flag: m.flag_away, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, PTS: 0 };
    });
    groupMatchesDone.forEach(m => {
      if (m.home_score === null || m.away_score === null) return;
      [
        [m.home_team_name, m.home_score, m.away_score],
        [m.away_team_name, m.away_score, m.home_score]
      ].forEach(([name, gp, gc]) => {
        teams[name].J++; teams[name].GP += gp; teams[name].GC += gc;
      });
      if (m.home_score > m.away_score) { teams[m.home_team_name].V++; teams[m.home_team_name].PTS += 3; teams[m.away_team_name].D++; }
      else if (m.home_score < m.away_score) { teams[m.away_team_name].V++; teams[m.away_team_name].PTS += 3; teams[m.home_team_name].D++; }
      else { teams[m.home_team_name].E++; teams[m.home_team_name].PTS++; teams[m.away_team_name].E++; teams[m.away_team_name].PTS++; }
    });
    return Object.entries(teams)
      .map(([name, s]) => ({ name, ...s, SG: s.GP - s.GC }))
      .sort((a, b) => b.PTS - a.PTS || b.SG - a.SG || b.GP - a.GP);
  }, [activeGroup, matches]);

  // Stats gerais
  const totalMatches = matches.length;
  const finishedCount = matches.filter(m => m.status === 'FINISHED').length;
  const liveCount = liveMatches.length;
  const totalParticipants = ranking.length;

  return (
    <div className="max-w-[1400px] mx-auto animate-fadeIn space-y-4">

      {/* ── Hero Banner ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neon-green/20 bg-gradient-to-br from-neon-green/10 via-dark-800 to-dark-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-neon-green text-xs font-bold uppercase tracking-widest mb-1">Acompanhe em tempo real</p>
          <h2 className="text-2xl font-black text-white">🏆 Bolão <span className="text-neon-green">Copa 2026</span></h2>
          <p className="text-gray-400 text-sm mt-1">
            {totalParticipants} participantes · {finishedCount}/{totalMatches} jogos realizados
            {liveCount > 0 && <span className="ml-2 text-red-400 font-bold animate-pulse">⚡ {liveCount} ao vivo!</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-5 py-2.5 rounded-full bg-neon-green text-dark-900 font-black text-sm hover:shadow-[0_0_20px_rgba(4,211,97,0.5)] transition-all hover:scale-105 active:scale-95"
          >
            Entrar e palpitar ⚽
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className="px-5 py-2.5 rounded-full border border-neon-green/30 text-neon-green font-bold text-sm hover:bg-neon-green/10 transition-all"
          >
            Ver jogos
          </button>
        </div>
      </div>

      {/* ── Cards resumo ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="🌍" label="Total de Jogos" value={totalMatches} sub="na Copa 2026" color="blue" />
        <StatCard icon="✅" label="Realizados" value={finishedCount} sub={`${totalMatches - finishedCount} restantes`} color="neon-green" />
        <StatCard icon="👥" label="Participantes" value={totalParticipants} sub="no bolão" color="yellow" />
        <StatCard icon={liveCount > 0 ? "🔴" : "⏰"} label={liveCount > 0 ? "Jogos Ao Vivo" : "Próximos Jogos"} value={liveCount > 0 ? liveCount : upcomingMatches.length} sub={liveCount > 0 ? "acontecendo agora!" : "agendados"} color={liveCount > 0 ? "red" : "purple"} highlight />
      </div>

      {/* ── Estatísticas da Galera ────────────────────────────────────── */}
      {stats && (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">📊 Estatísticas da Galera</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">Maior Vidente</p>
              <p className="text-sm font-bold text-yellow-400 truncate" title={stats.top_scorer}>{stats.top_scorer}</p>
            </div>
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">Mais Seguro</p>
              <p className="text-sm font-bold text-neon-green truncate" title={stats.safest_player}>{stats.safest_player}</p>
            </div>
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">🏮 Lanterna</p>
              <p className="text-sm font-bold text-red-400 truncate" title={stats.lanterna}>{stats.lanterna}</p>
            </div>
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">Média de Pontos</p>
              <p className="text-sm font-bold text-white truncate">{stats.media_pontos} pts</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Linha principal ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Coluna esquerda: Gráficos + Jogos */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Tendências */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">📊 Tendências da Copa</h3>
            {finishedMatchesAll.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex-shrink-0">
                  <DonutChart slices={trendSlices} size={96} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neon-green"></span><span className="text-gray-300">Mandante</span></div><span className="font-bold">{homeWins}</span></div>
                  <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span><span className="text-gray-300">Empate</span></div><span className="font-bold">{draws}</span></div>
                  <div className="flex justify-between text-xs"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className="text-gray-300">Visitante</span></div><span className="font-bold">{awayWins}</span></div>
                </div>
              </div>
            ) : <p className="text-center text-gray-500 text-sm py-4">Sem dados.</p>}
          </div>

          {/* Goleada */}
          {maxGoalsMatch && maxGoals > 0 && (
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 bg-gradient-to-br from-dark-800 to-purple-900/10">
              <h3 className="font-bold text-purple-400 text-xs uppercase tracking-wider mb-3">🔥 Jogo Mais Emocionante</h3>
              <MatchRow match={maxGoalsMatch} onClick={() => { }} />
            </div>
          )}

          {/* Jogos ao vivo */}
          {liveMatches.length > 0 && (
            <div className="bg-dark-800 border border-red-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-red-400 text-sm uppercase tracking-wider">Ao Vivo Agora</h3>
              </div>
              <div className="flex flex-col gap-2">
                {liveMatches.map(m => <MatchRow key={m.id} match={m} onClick={() => { }} />)}
              </div>
            </div>
          )}

          {/* Últimos jogos */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">⚽ Últimos Resultados</h3>
              <button onClick={() => setActiveTab('matches')} className="text-xs text-neon-green hover:underline">Ver todos →</button>
            </div>
            {finishedMatches.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Nenhum jogo encerrado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {finishedMatches.map(m => <MatchRow key={m.id} match={m} onClick={() => { }} />)}
              </div>
            )}
          </div>
        </div>

        {/* Coluna central: Ranking com Pódio */}
        <div className="lg:col-span-4 bg-dark-800 border border-dark-700 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">🏆 Ranking Geral</h3>
            <button onClick={() => setActiveTab('ranking')} className="text-xs text-neon-green hover:underline">Ver completo →</button>
          </div>
          {top5.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">Nenhum palpite ainda.</p>
          ) : (
            <div className="flex flex-col gap-4 flex-1">
              {/* Pódio Visual (Top 3) */}
              <div className="flex items-end justify-center h-44 gap-2 mb-2">
                {/* 2º Lugar */}
                {top5[1] && (
                  <div className="flex flex-col items-center w-1/3 animate-[slideUp_0.5s_ease-out]">
                    <span className="text-sm font-bold text-gray-300 truncate w-full text-center px-1">{top5[1].first_name || top5[1].username}</span>
                    <span className="text-[10px] font-black text-white mb-1">{top5[1].total_points} pts</span>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold" title="Cravadas">🎯 {top5[1].cravadas || 0}</span>
                        <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20 font-bold" title="Acertos">✓ {top5[1].acertos || 0}</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-dark-700 to-dark-600 rounded-t-xl h-20 border-t-2 border-gray-400 flex items-start justify-center pt-2">
                      <span className="text-2xl">🥈</span>
                    </div>
                  </div>
                )}
                {/* 1º Lugar */}
                {top5[0] && (
                  <div className="flex flex-col items-center w-1/3 z-10 animate-[slideUp_0.7s_ease-out]">
                    <span className="text-2xl mb-1 animate-bounce">👑</span>
                    <span className="text-sm font-bold text-yellow-400 truncate w-full text-center px-1">{top5[0].first_name || top5[0].username}</span>
                    <span className="text-[10px] font-black text-white mb-1">{top5[0].total_points} pts</span>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold" title="Cravadas">🎯 {top5[0].cravadas || 0}</span>
                        <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20 font-bold" title="Acertos">✓ {top5[0].acertos || 0}</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-yellow-500/20 to-yellow-500/40 rounded-t-xl h-28 border-t-2 border-yellow-400 flex items-start justify-center pt-2 shadow-[0_-5px_20px_rgba(250,204,21,0.2)]">
                      <span className="text-2xl">🥇</span>
                    </div>
                  </div>
                )}
                {/* 3º Lugar */}
                {top5[2] && (
                  <div className="flex flex-col items-center w-1/3 animate-[slideUp_0.6s_ease-out]">
                    <span className="text-sm font-bold text-orange-400 truncate w-full text-center px-1">{top5[2].first_name || top5[2].username}</span>
                    <span className="text-[10px] font-black text-white mb-1">{top5[2].total_points} pts</span>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold" title="Cravadas">🎯 {top5[2].cravadas || 0}</span>
                        <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20 font-bold" title="Acertos">✓ {top5[2].acertos || 0}</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-orange-900/40 to-orange-800/40 rounded-t-xl h-16 border-t-2 border-orange-500 flex items-start justify-center pt-2">
                      <span className="text-2xl">🥉</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 4º e 5º lugares */}
              <div className="flex flex-col gap-1.5">
                {top5.slice(3).map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-900/50 border border-dark-700/50">
                    <span className="text-[10px] text-gray-500 font-bold w-6">{i + 4}º</span>
                    <div className="flex-1 flex flex-col">
                        <span className="text-sm text-gray-300 font-semibold truncate">{u.first_name || u.username}</span>
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
                    <span className="text-xs font-black text-neon-green">{u.total_points} pts</span>
                  </div>
                ))}
              </div>

              {/* CTA para logar */}
              <div className="mt-auto pt-3 border-t border-dark-700">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full py-2 rounded-xl border border-neon-green/30 text-neon-green text-xs font-bold hover:bg-neon-green/10 transition-all"
                >
                  Entrar e ver sua posição →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita: Grupos + Próximos */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Classificação de grupo */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">🗂 Grupos</h3>
              {groups.length > 0 && (
                <select value={activeGroup} onChange={e => setSelectedGroup(e.target.value)}
                  className="bg-dark-900 border border-dark-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-neon-green">
                  {groups.map(g => <option key={g} value={g}>Grupo {g}</option>)}
                </select>
              )}
            </div>
            {groupTable.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Nenhum dado ainda.</p>
            ) : (
              <>
                <div className="grid grid-cols-10 text-[9px] font-bold text-gray-500 uppercase tracking-wider px-1 pb-1 border-b border-dark-700 mb-1">
                  <span className="col-span-1">#</span>
                  <span className="col-span-3">Equipe</span>
                  <span className="col-span-1 text-center">J</span>
                  <span className="col-span-1 text-center">V</span>
                  <span className="col-span-1 text-center">E</span>
                  <span className="col-span-1 text-center">D</span>
                  <span className="col-span-1 text-center">SG</span>
                  <span className="col-span-1 text-center font-black">P</span>
                </div>
                {groupTable.map((t, i) => (
                  <div key={t.name} className={`grid grid-cols-10 items-center px-1 py-1.5 rounded-lg mb-0.5 ${i < 2 ? 'bg-neon-green/5 border border-neon-green/10' : 'hover:bg-dark-700'}`}>
                    <span className={`col-span-1 text-xs font-black ${i < 2 ? 'text-neon-green' : 'text-gray-500'}`}>{i + 1}</span>
                    <div className="col-span-3 flex items-center gap-1">
                      {t.flag && <img src={t.flag} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />}
                      <span className="text-xs text-gray-300 truncate">{t.name}</span>
                    </div>
                    <span className="col-span-1 text-center text-xs text-gray-400">{t.J}</span>
                    <span className="col-span-1 text-center text-xs text-gray-400">{t.V}</span>
                    <span className="col-span-1 text-center text-xs text-gray-400">{t.E}</span>
                    <span className="col-span-1 text-center text-xs text-gray-400">{t.D}</span>
                    <span className={`col-span-1 text-center text-xs ${t.SG > 0 ? 'text-neon-green' : t.SG < 0 ? 'text-red-400' : 'text-gray-400'}`}>{t.SG > 0 ? `+${t.SG}` : t.SG}</span>
                    <span className="col-span-1 text-center text-xs font-black text-white">{t.PTS}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Próximos jogos */}
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">⏭ Próximos Jogos</h3>
              <button onClick={() => setActiveTab('matches')} className="text-xs text-neon-green hover:underline">Ver todos →</button>
            </div>
            {upcomingMatches.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Nenhum jogo agendado.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingMatches.map(m => <MatchRow key={m.id} match={m} onClick={() => { }} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PESSOAL (logado)
// ═══════════════════════════════════════════════════════════════════════════════
function PersonalDashboard({ ranking, matches, userBets, loggedUser, handleOpenModal, setActiveTab, API_URL, accessToken, stats }) {
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [leaderBets, setLeaderBets] = useState([]);
  const [secadorIndex, setSecadorIndex] = useState(0);
  const [withoutBetIndex, setWithoutBetIndex] = useState(0);
  const [nextBetIndex, setNextBetIndex] = useState(0);

  const userRankPos = ranking.findIndex(u => u.id === loggedUser.id);
  const userRankData = userRankPos >= 0 ? ranking[userRankPos] : null;
  const top5 = ranking.slice(0, 5);
  const isLeader = userRankPos === 0;

  // Stats pessoais
  const totalBets = userBets.length;
  const exactBets = userBets.filter(b => b.points_earned === 5).length;
  const winnerBets = userBets.filter(b => b.points_earned === 3).length;
  const wrongBets = userBets.filter(b => b.points_earned === 0 && matches.find(m => m.id === b.match)?.status === 'FINISHED').length;
  const hitRate = totalBets > 0 ? Math.round(((exactBets + winnerBets) / totalBets) * 100) : 0;
  const myPoints = userRankData?.total_points ?? 0;

  // Gráfico Circular de Precisão
  const totalResolved = exactBets + winnerBets + wrongBets || 1;
  const precisionSlices = [
    { pct: (exactBets / totalResolved) * 100, label: 'Cravada' },
    { pct: (winnerBets / totalResolved) * 100, label: 'Acerto' },
    { pct: (wrongBets / totalResolved) * 100, label: 'Erro' }
  ];

  // Gamificação: Streak (Badges)
  const myFinishedBets = userBets
    .filter(b => matches.find(m => m.id === b.match)?.status === 'FINISHED')
    .sort((a, b) => new Date(matches.find(m => m.id === a.match).match_date) - new Date(matches.find(m => m.id === b.match).match_date));

  let streakBadge = null;
  if (myFinishedBets.length >= 2) {
    const last2 = myFinishedBets.slice(-2);
    if (last2.every(b => b.points_earned === 5)) streakBadge = { icon: '🔥', text: 'Em Chamas', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' };
  }
  if (!streakBadge && myFinishedBets.length >= 3) {
    const last3 = myFinishedBets.slice(-3);
    if (last3.every(b => b.points_earned === 0)) streakBadge = { icon: '🥶', text: 'Gelado', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' };
  }
  if (!streakBadge && isLeader) {
    streakBadge = { icon: '👑', text: 'Líder Isolado', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' };
  }

  // Fetch Secador do Líder
  const leaderId = top5[0]?.id;
  useEffect(() => {
    if (!isLeader && API_URL && accessToken && leaderId) {
      fetch(`${API_URL}/bets/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
        .then(r => r.json())
        .then(data => {
          const betsArray = Array.isArray(data) ? data : (data.results || []);
          setLeaderBets(betsArray.filter(b => b.user === leaderId));
        })
        .catch(console.error);
    }
  }, [isLeader, API_URL, accessToken, leaderId]);

  // Jogos ao vivo com meu palpite
  const liveMatches = matches.filter(m => m.status === 'IN_PROGRESS');

  // Últimos meus resultados
  const myLastResults = userBets
    .filter(b => matches.find(m => m.id === b.match)?.status === 'FINISHED')
    .sort((a, b) => new Date(matches.find(m => m.id === b.match).match_date) - new Date(matches.find(m => m.id === a.match).match_date))
    .slice(0, 4)
    .map(b => ({ ...b, matchData: matches.find(m => m.id === b.match) }));

  // Secador do Líder: Próximos jogos simultâneos (PENDING) com o palpite do líder
  const pendingWithLeaderBet = matches
    .filter(m => m.status === 'PENDING' && leaderBets.find(b => b.match === m.id))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const secadorLeaderGames = [];
  if (pendingWithLeaderBet.length > 0) {
    const nextTimeMs = new Date(pendingWithLeaderBet[0].match_date).getTime();
    secadorLeaderGames.push(...pendingWithLeaderBet.filter(m => new Date(m.match_date).getTime() === nextTimeMs));
  }

  // Próximos sem palpite (todos os próximos simultâneos)
  const nextWithoutBetAll = matches
    .filter(m => m.status === 'PENDING' && !userBets.find(b => b.match === m.id))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  // Banner de Urgência (Jogos nas próximas 12h sem palpite)
  const now = new Date();
  const urgentMatches = nextWithoutBetAll.filter(m => {
    const hoursLeft = (new Date(m.match_date) - now) / 3600000;
    return hoursLeft > 0 && hoursLeft <= 12;
  });

  // Próximos com palpite
  const nextWithBetAll = matches
    .filter(m => m.status === 'PENDING' && userBets.find(b => b.match === m.id))
    .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  // Gráfico de evolução top 3 + eu
  const chartLabels = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];
  const top3 = ranking.slice(0, 3);
  const seriesRaw = top3.length > 0 ? top3.map((u, i) => ({
    name: u.id === loggedUser.id ? 'Você' : (u.first_name || u.username),
    isMe: u.id === loggedUser.id,
    data: chartLabels.map((_, j) => Math.round(u.total_points * ((j + 1) / chartLabels.length) * (0.88 + (i * 0.04))))
  })) : [{ name: 'Você', isMe: true, data: [0, 0, 0, 0, 0, 0, 0, myPoints] }];

  // Distribuição geral de palpites por resultado
  const groups = [...new Set(matches.map(m => m.group).filter(Boolean))].sort();
  const activeGroup = groups.includes(selectedGroup) ? selectedGroup : (groups[0] || 'A');
  const groupMatchesDone = matches.filter(m => m.group === activeGroup && (m.status === 'FINISHED' || m.status === 'IN_PROGRESS'));
  const groupTable = useMemo(() => {
    const teams = {};
    matches.filter(m => m.group === activeGroup).forEach(m => {
      if (!teams[m.home_team_name]) teams[m.home_team_name] = { flag: m.flag_home, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, PTS: 0 };
      if (!teams[m.away_team_name]) teams[m.away_team_name] = { flag: m.flag_away, J: 0, V: 0, E: 0, D: 0, GP: 0, GC: 0, PTS: 0 };
    });
    groupMatchesDone.forEach(m => {
      if (m.home_score === null || m.away_score === null) return;
      [[m.home_team_name, m.home_score, m.away_score],
      [m.away_team_name, m.away_score, m.home_score]].forEach(([name, gp, gc]) => {
        teams[name].J++; teams[name].GP += gp; teams[name].GC += gc;
      });
      if (m.home_score > m.away_score) { teams[m.home_team_name].V++; teams[m.home_team_name].PTS += 3; teams[m.away_team_name].D++; }
      else if (m.home_score < m.away_score) { teams[m.away_team_name].V++; teams[m.away_team_name].PTS += 3; teams[m.home_team_name].D++; }
      else { teams[m.home_team_name].E++; teams[m.home_team_name].PTS++; teams[m.away_team_name].E++; teams[m.away_team_name].PTS++; }
    });
    return Object.entries(teams).map(([name, s]) => ({ name, ...s, SG: s.GP - s.GC }))
      .sort((a, b) => b.PTS - a.PTS || b.SG - a.SG || b.GP - a.GP);
  }, [activeGroup, matches]);

  const firstName = loggedUser.first_name || loggedUser.username;

  return (
    <div className="max-w-[1400px] mx-auto animate-fadeIn space-y-4">

      {/* ── Banner de Urgência (Comentado) ──────────────────────────────────────── */}
      {/* {urgentMatches.length > 0 && (
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
      )} */}

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

      {/* ── Estatísticas da Galera ────────────────────────────────────── */}
      {stats && (
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3">📊 Estatísticas da Galera</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">Maior Vidente</p>
              <p className="text-sm font-bold text-yellow-400 truncate" title={stats.top_scorer}>{stats.top_scorer}</p>
            </div>
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">Mais Seguro</p>
              <p className="text-sm font-bold text-neon-green truncate" title={stats.safest_player}>{stats.safest_player}</p>
            </div>
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">🏮 Lanterna</p>
              <p className="text-sm font-bold text-red-400 truncate" title={stats.lanterna}>{stats.lanterna}</p>
            </div>
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700">
              <p className="text-[10px] text-gray-500 uppercase">Média de Pontos</p>
              <p className="text-sm font-bold text-white truncate">{stats.media_pontos} pts</p>
            </div>
          </div>
        </div>
      )}



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

        {/* Secador do Líder (Menor) */}
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
                        <p className="text-xs text-gray-400 mt-2 italic">Ainda não palpitou</p>
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

        {/* Ranking top 5 com destaque pessoal */}
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

      {/* ── Próximos jogos para palpitar + Grupos ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Jogos sem palpite */}
        {nextWithoutBetAll.length > 0 && (
          <div className="lg:col-span-4 bg-dark-800 border border-yellow-400/20 rounded-2xl p-4">
            {(() => {
              const nextTimeMs = new Date(nextWithoutBetAll[0].match_date).getTime();
              const simultaneous = nextWithoutBetAll.filter(m => new Date(m.match_date).getTime() === nextTimeMs);
              const isSimul = simultaneous.length > 1;
              const curIdx = withoutBetIndex >= simultaneous.length ? 0 : withoutBetIndex;
              const m = simultaneous[curIdx];
              if (!m) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wider">⚠️ Ainda sem palpite!</h3>
                    {isSimul && (
                      <div className="flex items-center gap-1.5 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                        <button onClick={() => setWithoutBetIndex(prev => prev > 0 ? prev - 1 : simultaneous.length - 1)} className="text-yellow-500 hover:text-white transition-colors">◀</button>
                        <span className="text-[10px] text-yellow-500 font-bold">{curIdx + 1}/{simultaneous.length}</span>
                        <button onClick={() => setWithoutBetIndex(prev => prev < simultaneous.length - 1 ? prev + 1 : 0)} className="text-yellow-500 hover:text-white transition-colors">▶</button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <MatchRow key={m.id} match={m} onClick={() => handleOpenModal(m)} />
                  </div>
                </>
              );
            })()}
            <button onClick={() => setActiveTab('matches')} className="mt-3 w-full py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold hover:bg-yellow-400/20 transition-all">
              Palpitar agora ⚽
            </button>
          </div>
        )}

        {/* Jogos com palpite */}
        {nextWithBetAll.length > 0 && (
          <div className="lg:col-span-4 bg-dark-800 border border-neon-green/20 rounded-2xl p-4">
            {(() => {
              const nextTimeMs = new Date(nextWithBetAll[0].match_date).getTime();
              const simultaneous = nextWithBetAll.filter(m => new Date(m.match_date).getTime() === nextTimeMs);
              const isSimul = simultaneous.length > 1;
              const curIdx = nextBetIndex >= simultaneous.length ? 0 : nextBetIndex;
              const m = simultaneous[curIdx];
              if (!m) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-neon-green text-sm uppercase tracking-wider">✅ Próximos palpites</h3>
                    {isSimul && (
                      <div className="flex items-center gap-1.5 bg-neon-green/10 px-2 py-0.5 rounded-lg border border-neon-green/20">
                        <button onClick={() => setNextBetIndex(prev => prev > 0 ? prev - 1 : simultaneous.length - 1)} className="text-neon-green hover:text-white transition-colors">◀</button>
                        <span className="text-[10px] text-neon-green font-bold">{curIdx + 1}/{simultaneous.length}</span>
                        <button onClick={() => setNextBetIndex(prev => prev < simultaneous.length - 1 ? prev + 1 : 0)} className="text-neon-green hover:text-white transition-colors">▶</button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <MatchRow key={m.id} match={m} userBet={userBets.find(b => b.match === m.id)} showBet onClick={() => handleOpenModal(m)} />
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Grupos */}
        <div className={`${(nextWithoutBetAll.length > 0 && nextWithBetAll.length > 0) ? 'lg:col-span-4' : nextWithoutBetAll.length > 0 || nextWithBetAll.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} bg-dark-800 border border-dark-700 rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">🗂 Classificação dos Grupos</h3>
            {groups.length > 0 && (
              <select value={activeGroup} onChange={e => setSelectedGroup(e.target.value)}
                className="bg-dark-900 border border-dark-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-neon-green">
                {groups.map(g => <option key={g} value={g}>Grupo {g}</option>)}
              </select>
            )}
          </div>
          {groupTable.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Nenhum dado ainda.</p>
          ) : (
            <>
              <div className="grid grid-cols-10 text-[9px] font-bold text-gray-500 uppercase tracking-wider px-1 pb-1 border-b border-dark-700 mb-1">
                <span>#</span><span className="col-span-3">Equipe</span>
                <span className="text-center">J</span><span className="text-center">V</span>
                <span className="text-center">E</span><span className="text-center">D</span>
                <span className="text-center">SG</span><span className="text-center font-black">P</span>
              </div>
              {groupTable.map((t, i) => (
                <div key={t.name} className={`grid grid-cols-10 items-center px-1 py-1.5 rounded-lg mb-0.5 ${i < 2 ? 'bg-neon-green/5 border border-neon-green/10' : 'hover:bg-dark-700'}`}>
                  <span className={`text-xs font-black ${i < 2 ? 'text-neon-green' : 'text-gray-500'}`}>{i + 1}</span>
                  <div className="col-span-3 flex items-center gap-1">
                    {t.flag && <img src={t.flag} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />}
                    <span className="text-xs text-gray-300 truncate">{t.name}</span>
                  </div>
                  <span className="text-center text-xs text-gray-400">{t.J}</span>
                  <span className="text-center text-xs text-gray-400">{t.V}</span>
                  <span className="text-center text-xs text-gray-400">{t.E}</span>
                  <span className="text-center text-xs text-gray-400">{t.D}</span>
                  <span className={`text-center text-xs ${t.SG > 0 ? 'text-neon-green' : t.SG < 0 ? 'text-red-400' : 'text-gray-400'}`}>{t.SG > 0 ? `+${t.SG}` : t.SG}</span>
                  <span className="text-center text-xs font-black text-white">{t.PTS}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO PRINCIPAL — escolhe o modo
// ═══════════════════════════════════════════════════════════════════════════════
export function DashboardTab({ ranking, matches, userBets, loggedUser, handleOpenModal, setActiveTab, setShowLoginModal, API_URL, accessToken }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!API_URL) return;
    fetch(`${API_URL}/stats/`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [API_URL]);

  if (loggedUser) {
    return (
      <PersonalDashboard
        ranking={ranking}
        matches={matches}
        userBets={userBets}
        loggedUser={loggedUser}
        handleOpenModal={handleOpenModal}
        setActiveTab={setActiveTab}
        API_URL={API_URL}
        accessToken={accessToken}
        stats={stats}
      />
    );
  }
  return (
    <PublicDashboard
      ranking={ranking}
      matches={matches}
      setActiveTab={setActiveTab}
      setShowLoginModal={setShowLoginModal}
      stats={stats}
    />
  );
}
