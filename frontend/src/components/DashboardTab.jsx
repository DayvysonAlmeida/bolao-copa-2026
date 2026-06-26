import { useState, useMemo, useEffect, Component } from 'react';
import confetti from 'canvas-confetti';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardMiddle } from './dashboard/DashboardMiddle';
import { DashboardBottom } from './dashboard/DashboardBottom';

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

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PESSOAL (logado)
// ═══════════════════════════════════════════════════════════════════════════════
function PersonalDashboard({ ranking, matches, userBets, loggedUser, handleOpenModal, setActiveTab, API_URL, accessToken, stats, activeBolao }) {
  const [selectedGroup, setSelectedGroup] = useState('A');
  const [leaderBets, setLeaderBets] = useState([]);

  const userRankPos = ranking.findIndex(u => u.id === loggedUser.id);
  const userRankData = userRankPos >= 0 ? ranking[userRankPos] : null;
  const top5 = ranking.slice(0, 5);
  const isLeader = userRankPos === 0;

  // Filtra apostas do Bolão Atual (para as estatísticas e evolução)
  const activeBolaoBets = useMemo(() => {
    return userBets.filter(b => matches.some(m => m.id === b.match && m.bolao === activeBolao?.id));
  }, [userBets, matches, activeBolao]);

  // Cálculos de precisão
  const totalBets = activeBolaoBets.length;
  const exactBets = activeBolaoBets.filter(b => b.points_earned === 5).length;
  const winnerBets = activeBolaoBets.filter(b => b.points_earned === 3).length;
  const missBets = activeBolaoBets.filter(b => b.points_earned === 0 && matches.find(m => m.id === b.match)?.status === 'FINISHED').length;
  const myPoints = activeBolaoBets.reduce((acc, b) => acc + (b.points_earned || 0), 0);
  const hitRate = totalBets > 0 ? Math.round(((exactBets + winnerBets) / totalBets) * 100) : 0;
  
  const precisionSlices = totalBets > 0 
    ? [
        { value: exactBets, color: '#04d361', pct: (exactBets/totalBets)*100 },
        { value: winnerBets, color: '#eab308', pct: (winnerBets/totalBets)*100 },
        { value: missBets, color: '#f87171', pct: (missBets/totalBets)*100 }
      ]
    : [ { value: 1, color: '#3f3f46', pct: 0 }, { value: 0, pct: 0 }, { value: 0, pct: 0 } ];

  // Confetes para o usuário (Golaço / Placar Exato)
  useEffect(() => {
    if (totalBets > 0) {
      const recentFinished = activeBolaoBets.filter(b => {
        const m = matches.find(x => x.id === b.match);
        return m && m.status === 'FINISHED';
      }).sort((a, b) => new Date(matches.find(x => x.id === b.match).match_date) - new Date(matches.find(x => x.id === a.match).match_date));
      
      const lastBet = recentFinished[0];
      if (lastBet && lastBet.points_earned >= 5) {
        const hasCelebrated = localStorage.getItem(`celebrated_${lastBet.id}`);
        if (!hasCelebrated) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#04d361', '#facc15', '#ffffff']
          });
          localStorage.setItem(`celebrated_${lastBet.id}`, 'true');
        }
      }
    }
  }, [activeBolaoBets, matches, totalBets]);

  // Gamificação: Streak (Badges)
  const myFinishedBets = activeBolaoBets
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
  const myLastResults = activeBolaoBets
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
    <DashboardErrorBoundary>
      <div className="max-w-[1400px] mx-auto animate-fadeIn space-y-4">
        
        <DashboardHeader
          urgentMatches={urgentMatches}
          handleOpenModal={handleOpenModal}
          firstName={firstName}
          streakBadge={streakBadge}
          userRankData={userRankData}
          userRankPos={userRankPos}
          myPoints={myPoints}
          isLeader={isLeader}
          exactBets={exactBets}
          winnerBets={winnerBets}
          hitRate={hitRate}
          totalBets={totalBets}
          precisionSlices={precisionSlices}
        />

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

        <DashboardMiddle
          liveMatches={liveMatches}
          userBets={userBets}
          myLastResults={myLastResults}
          setActiveTab={setActiveTab}
          chartLabels={chartLabels}
          seriesRaw={seriesRaw}
          isLeader={isLeader}
          leaderId={leaderId}
          secadorLeaderGames={secadorLeaderGames}
          top5={top5}
          leaderBets={leaderBets}
          loggedUser={loggedUser}
          userRankPos={userRankPos}
          userRankData={userRankData}
          firstName={firstName}
          myPoints={myPoints}
        />

        <DashboardBottom
          nextWithoutBetAll={nextWithoutBetAll}
          nextWithBetAll={nextWithBetAll}
          handleOpenModal={handleOpenModal}
          setActiveTab={setActiveTab}
          userBets={userBets}
          activeBolao={activeBolao}
          groups={groups}
          activeGroup={activeGroup}
          setSelectedGroup={setSelectedGroup}
          groupTable={groupTable}
        />

      </div>
    </DashboardErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export function DashboardTab({ ranking, matches, userBets, loggedUser, handleOpenModal, setActiveTab, API_URL, accessToken, activeBolao }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!API_URL || !activeBolao) return;
    fetch(`${API_URL}/bolaos/${activeBolao.id}/stats/`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [API_URL, activeBolao]);

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
      activeBolao={activeBolao}
    />
  );
}
