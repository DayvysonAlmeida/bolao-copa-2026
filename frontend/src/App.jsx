import { useState, useEffect } from 'react'

function App() {
  // Define a URL da API (Puxa do Vercel em produção, ou usa Localhost no dev)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  // Estados de Navegação

  // Estados de Dados
  const [matches, setMatches] = useState([])
  const [ranking, setRanking] = useState([])

  // Estados do Modal de Palpite
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [homeBet, setHomeBet] = useState('')
  const [awayBet, setHomeBetAway] = useState('')
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

  // Estados de Login
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [loggedUser, setLoggedUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [userBets, setUserBets] = useState([])
  const [editingBetId, setEditingBetId] = useState(null)
  const [activeTab, setActiveTab] = useState('matches') // 'matches', 'ranking' ou 'my-bets'
  const betChangeDeadline = new Date('2026-06-10T23:59:59')
  const isBeforeBetChangeDeadline = new Date() <= betChangeDeadline
  const betChangeDeadlineLabel = '10/06/2026'
  const isLoggedIn = Boolean(loggedUser)
  const userRankPosition = isLoggedIn && ranking.length > 0 ? ranking.findIndex(user => user.id === loggedUser.id) : -1

  // Busca os Jogos (Roda 1 vez quando o app abre)
  useEffect(() => {
    fetch(`${API_URL}/matches/`)
      .then(response => response.json())
      .then(data => setMatches(data))
      .catch(error => console.error("Erro ao buscar jogos:", error))
  }, [])

  // Busca o Ranking sempre que a aba de Ranking for clicada
  useEffect(() => {
    if (activeTab === 'ranking') {
      fetch(`${API_URL}/ranking/`)
        .then(response => response.json())
        .then(data => setRanking(data))
        .catch(error => console.error("Erro ao buscar ranking:", error))
    }
  }, [activeTab])

  // Lógica de Agrupamento dos Jogos
  const groupedMatches = matches.reduce((acc, match) => {
    const groupName = match.group ? `Grupo ${match.group}` : 'Fase Final';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(match);
    return acc;
  }, {});
  const sortedGroups = Object.keys(groupedMatches).sort();

  // Funções do Modal
  const getUserBetForMatch = (matchId) => {
    return userBets.find(bet => bet.match === matchId) || null
  }

  const handleOpenModal = (match) => {
    if (match.status === 'FINISHED') {
      alert("Este jogo já encerrou! Não é possível enviar palpites.")
      return;
    }

    if (!accessToken) {
      setSelectedMatch(match)
      setShowLoginModal(true)
      setLoginError('')
      return;
    }

    const existingBet = getUserBetForMatch(match.id)
    setSelectedMatch(match)
    setHomeBet(existingBet ? existingBet.home_score.toString() : '')
    setHomeBetAway(existingBet ? existingBet.away_score.toString() : '')
    setEditingBetId(existingBet ? existingBet.id : null)
    setStatusMessage({ type: '', text: '' })
  }

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))
      return JSON.parse(jsonPayload)
    } catch {
      return null
    }
  }

  const fetchUserBets = async (token) => {
    try {
      const response = await fetch(`${API_URL}/my-bets/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      const data = await response.json()
      if (response.ok) {
        setUserBets(Array.isArray(data) ? data : [])
      } else {
        console.error('Falha ao buscar meus palpites:', data)
      }
    } catch (error) {
      console.error('Erro ao buscar palpites do usuário:', error)
    }
  }

  useEffect(() => {
    if (accessToken && loggedUser?.id) {
      fetchUserBets(accessToken)
    }
  }, [accessToken, loggedUser])

  useEffect(() => {
    if (!statusMessage.text) return

    const timer = setTimeout(() => {
      setStatusMessage({ type: '', text: '' })
    }, 5000)

    return () => clearTimeout(timer)
  }, [statusMessage])

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!usernameInput || !passwordInput) {
      setLoginError('Preencha usuário e senha.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      })

      const data = await response.json()
      if (!response.ok) {
        setLoginError('Usuário ou senha inválidos.')
        return
      }

      const payload = parseJwt(data.access)
      const userId = payload?.user_id ?? null
      setAccessToken(data.access)
      setRefreshToken(data.refresh)
      setLoggedUser({ id: userId, username: usernameInput })
      setShowLoginModal(false)
      setLoginError('')
      setUsernameInput('')
      setPasswordInput('')
      setStatusMessage({ type: 'success', text: 'Login realizado. Agora envie seu palpite.' })
      if (userId) {
        await fetchUserBets(data.access)
      }
    } catch (error) {
      console.error('Erro de login:', error)
      setLoginError('Erro de conexão ao autenticar.')
    }
  }

  const handleLogout = () => {
    setAccessToken('')
    setRefreshToken('')
    setLoggedUser(null)
    setUserBets([])
    setEditingBetId(null)
    setSelectedMatch(null)
    setShowLoginModal(false)
    setStatusMessage({ type: 'success', text: 'Você saiu da conta.' })
  }

  const handleSaveBet = (e) => {
    e.preventDefault();
    if (homeBet === '' || awayBet === '') {
      setStatusMessage({ type: 'error', text: 'Preencha ambos os placares.' })
      return;
    }

    const betData = {
      user: loggedUser?.id ?? 1,
      match: selectedMatch.id,
      home_score: parseInt(homeBet),
      away_score: parseInt(awayBet)
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }

    const url = editingBetId ? `${API_URL}/bets/${editingBetId}/` : `${API_URL}/bets/`
    const method = editingBetId ? 'PUT' : 'POST'

    if (!isBeforeBetChangeDeadline) {
      setStatusMessage({ type: 'error', text: `O prazo para enviar ou alterar palpites terminou em ${betChangeDeadlineLabel}.` })
      return;
    }

    fetch(url, {
      method,
      headers,
      body: JSON.stringify(betData)
    })
    .then(async response => {
      const data = await response.json();
      if (response.ok) {
        setStatusMessage({ type: 'success', text: editingBetId ? 'Palpite atualizado! 🚀' : 'Palpite registrado! 🚀' })
        setEditingBetId(null)
        if (loggedUser?.id) {
          fetchUserBets(accessToken, loggedUser.id)
        }
        setTimeout(() => setSelectedMatch(null), 1500)
      } else {
        if (JSON.stringify(data).includes('unique')) {
          setStatusMessage({ type: 'error', text: 'Você já palpitou neste jogo!' })
        } else {
          setStatusMessage({ type: 'error', text: 'Erro ao salvar palpite.' })
        }
      }
    })
    .catch(error => {
      console.error("Erro:", error)
      setStatusMessage({ type: 'error', text: 'Erro de conexão.' })
    })
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 p-8 pb-20 relative">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <h1 className="text-4xl font-bold text-neon-green mb-2 tracking-tight">
                Bolão Copa 2026
              </h1>
              <p className="text-sm text-gray-400">Resultados e ranking visíveis para todos. Login apenas no modal para enviar ou alterar palpites.</p>
            </div>
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-dark-800 border border-dark-700 px-3 py-1 text-xs text-gray-400">Modo visitante disponível</span>
              {loggedUser ? (
                <span className="rounded-full bg-neon-green/10 text-neon-green px-3 py-1 text-xs font-semibold">Logado</span>
              ) : (
                <span className="rounded-full bg-blue-950 text-blue-300 px-3 py-1 text-xs font-medium">Sem login</span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            {loggedUser ? (
              <div className="inline-flex items-center gap-3 rounded-full border border-dark-700 bg-dark-900 px-4 py-3 text-gray-200 shadow-sm">
                <span className="font-semibold text-white">Olá, {loggedUser.username}</span>
                <button onClick={handleLogout} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Sair</button>
              </div>
            ) : (
              <div className="flex flex-col sm:items-end gap-2">
                <span className="text-sm text-gray-500">Clique em um jogo para entrar e palpitar.</span>
                <button onClick={() => { setSelectedMatch(null); setShowLoginModal(true); }} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Login</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mb-6 rounded-3xl border border-dark-700 bg-dark-800 p-5 text-sm text-gray-300 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isLoggedIn ? (
            <span>Você pode enviar ou alterar palpites até <span className="text-neon-green font-semibold">{betChangeDeadlineLabel}</span>.</span>
          ) : (
            <span>Ranking e resultados estão liberados sem login. Faça login apenas para enviar palpites.</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-dark-900 border border-dark-700 px-3 py-1 text-xs text-gray-400">Deadline: {betChangeDeadlineLabel}</span>
          {isLoggedIn && (
            <span className="rounded-full bg-neon-green/10 px-3 py-1 text-xs text-neon-green font-semibold">Palpites podem ser alterados</span>
          )}
        </div>
      </div>

      {statusMessage.text && !selectedMatch && (
        <div className={`max-w-6xl mx-auto mb-6 rounded-3xl border p-4 text-sm ${statusMessage.type === 'success' ? 'bg-green-950 border-green-900 text-green-300' : 'bg-red-950 border-red-900 text-red-300'}`}>
          {statusMessage.text}
        </div>
      )}

      {/* ================= NAVEGAÇÃO (TABS) ================= */}
      <nav className="flex justify-center gap-4 mb-12">
        <button 
          onClick={() => setActiveTab('matches')}
          className={`px-8 py-3 rounded-full font-bold transition-all ${
            activeTab === 'matches' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          ⚽ Jogos
        </button>
        <button 
          onClick={() => setActiveTab('my-bets')}
          className={`px-8 py-3 rounded-full font-bold transition-all ${
            activeTab === 'my-bets' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          📌 Meus palpites
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`px-8 py-3 rounded-full font-bold transition-all ${
            activeTab === 'ranking' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          🏆 Ranking
        </button>
      </nav>

      {/* ================= ABA: JOGOS ================= */}
      {activeTab === 'matches' && (
        <main className="max-w-6xl mx-auto flex flex-col gap-10 animate-fadeIn">
          {sortedGroups.map(groupName => (
            <section key={groupName}>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-200 bg-dark-800 px-5 py-2 rounded-full border border-dark-700 shadow-md">
                  {groupName}
                </h2>
                <div className="flex-1 h-px bg-dark-700"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedMatches[groupName].map(match => {
                  const dateObj = new Date(match.match_date);
                  const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const userBet = loggedUser ? getUserBetForMatch(match.id) : null
                  
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
                      key={match.id} 
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
                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50' 
                            : userBet.points_earned === 3
                              ? 'bg-neon-green/20 text-neon-green border-neon-green/50'
                              : 'bg-red-400/20 text-red-300 border-red-400/50'
                        }`}>
                          {userBet.points_earned === 5 ? '🎯 Na mosca!' : userBet.points_earned === 3 ? '✓ Acertou!' : '✗ Errou'}
                        </div>
                      )}
                      <div className="text-center mb-5">
                        <span className="text-xs font-mono text-gray-400 bg-dark-900 px-3 py-1 rounded-full group-hover:text-neon-green transition-colors">
                          {match.status === 'FINISHED' ? 'Encerrado' : `${dayMonth} às ${time}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col items-center w-1/3">
                          <img src={match.flag_home} alt={match.home_team_name} className="w-12 h-8 rounded-sm shadow-md mb-2 object-cover" />
                          <span className="text-sm font-semibold text-center truncate w-full text-gray-300">{match.home_team_name}</span>
                        </div>
                        <div className="text-3xl font-black text-white w-1/3 text-center flex justify-center items-center gap-3">
                          <span>{match.home_score !== null ? match.home_score : '-'}</span>
                          <span className="text-gray-600 text-lg font-normal">x</span>
                          <span>{match.away_score !== null ? match.away_score : '-'}</span>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                          <img src={match.flag_away} alt={match.away_team_name} className="w-12 h-8 rounded-sm shadow-md mb-2 object-cover" />
                          <span className="text-sm font-semibold text-center truncate w-full text-gray-300">{match.away_team_name}</span>
                        </div>
                      </div>
                      {loggedUser && getUserBetForMatch(match.id) && (
                        <div className="mt-4 px-4 py-3 rounded-2xl bg-dark-900 border border-dark-700 text-sm text-gray-300">
                          <div>
                            <span className="font-semibold text-neon-green">Seu palpite:</span> {getUserBetForMatch(match.id).home_score} x {getUserBetForMatch(match.id).away_score}
                          </div>
                          <div className="mt-2 text-xs text-gray-400">Clique no jogo para editar o palpite até {betChangeDeadlineLabel}.</div>
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
                  )
                })}
              </div>
            </section>
          ))}
        </main>
      )}

      {/* ================= ABA: RANKING ================= */}
      {activeTab === 'ranking' && (
        <main className="max-w-3xl mx-auto animate-fadeIn">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-2 sm:p-6 shadow-2xl">
            
            {ranking.length === 0 ? (
              <p className="text-center text-gray-400 py-10">Nenhum jogador pontuou ainda.</p>
            ) : (
              <div className="flex flex-col">
                {loggedUser && userRankPosition >= 0 && (
                  <div className="mb-4 rounded-3xl border border-neon-green/20 bg-neon-green/5 p-4 text-sm text-neon-green">
                    Você está em <span className="font-semibold">{userRankPosition + 1}º</span> lugar com <span className="font-semibold">{ranking[userRankPosition].total_points}</span> pts.
                  </div>
                )}
                {/* Cabeçalho da Tabela */}
                <div className="flex items-center justify-between px-4 pb-4 mb-2 border-b border-dark-700 text-sm font-bold text-gray-400 uppercase tracking-wider">
                  <span>Posição / Jogador</span>
                  <span>Pontos</span>
                </div>

                {/* Lista de Usuários */}
                {ranking.map((user, index) => {
                  // Lógica visual para o pódio
                  const isFirst = index === 0;
                  const isSecond = index === 1;
                  const isThird = index === 2;
                  
                  let positionStyle = "text-gray-500 bg-dark-900";
                  if (isFirst) positionStyle = "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]";
                  if (isSecond) positionStyle = "text-gray-300 bg-gray-300/10 border border-gray-300/20";
                  if (isThird) positionStyle = "text-orange-400 bg-orange-400/10 border border-orange-400/20";

                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center justify-between p-4 mb-2 rounded-xl transition-colors hover:bg-dark-700 ${isFirst ? 'bg-dark-700/50' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black ${positionStyle}`}>
                          {index + 1}º
                        </div>
                        <span className={`text-lg font-semibold ${isFirst ? 'text-white' : 'text-gray-300'}`}>
                          {user.username}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-neon-green">
                          {user.total_points}
                        </span>
                        <span className="text-sm font-medium text-gray-500">pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === 'my-bets' && (
        <main className="max-w-5xl mx-auto animate-fadeIn">
          <div className="bg-dark-800 rounded-3xl border border-dark-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Meus palpites</h2>
                <p className="text-sm text-gray-400">Jogos nos quais você já enviou um palpite.</p>
              </div>
              {!loggedUser && (
                <button onClick={() => setShowLoginModal(true)} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Login</button>
              )}
            </div>

            {!loggedUser ? (
              <div className="text-center text-gray-400 py-20">Faça login para ver seus palpites.</div>
            ) : userBets.length === 0 ? (
              <div className="text-center text-gray-400 py-20">Você ainda não registrou nenhum palpite.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userBets.map(bet => {
                  const match = matches.find(item => item.id === bet.match)
                  if (!match) return null

                  const dateObj = new Date(match.match_date)
                  const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  
                  let resultBorderClass = 'border-dark-700';
                  let resultShadowClass = '';
                  
                  if (match.status === 'FINISHED') {
                    if (bet.points_earned === 5) {
                      resultBorderClass = 'border-yellow-400/80';
                      resultShadowClass = 'shadow-[0_0_20px_rgba(250,204,21,0.5)]';
                    } else if (bet.points_earned === 3) {
                      resultBorderClass = 'border-neon-green/95';
                      resultShadowClass = 'shadow-[0_0_25px_rgba(4,211,97,0.7)]';
                    } else if (bet.points_earned < 3) {
                      resultBorderClass = 'border-red-400/80';
                      resultShadowClass = 'shadow-[0_0_20px_rgba(248,113,113,0.5)]';
                    }
                  }

                  return (
                    <div key={bet.id} onClick={() => handleOpenModal(match)} className={`relative bg-dark-900 rounded-3xl border p-5 shadow-lg cursor-pointer transition-all ${resultBorderClass} ${resultShadowClass} ${match.status === 'FINISHED' ? 'opacity-60 cursor-not-allowed' : 'hover:border-neon-green'}`}>
                      {match.status === 'FINISHED' && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 rounded-full text-xs font-bold px-3 py-1 border ${
                          bet.points_earned === 5 
                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50' 
                            : bet.points_earned === 3
                              ? 'bg-neon-green/20 text-neon-green border-neon-green/50'
                              : 'bg-red-400/20 text-red-300 border-red-400/50'
                        }`}>
                          {bet.points_earned === 5 ? '🎯 Exato!' : bet.points_earned === 3 ? '✓ Acertou!' : '✗ Errou'} ({bet.points_earned} pts)
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{match.group ? `Grupo ${match.group}` : 'Fase Final'}</span>
                        <span className="text-xs text-gray-400">{match.status === 'FINISHED' ? 'Encerrado' : `${dayMonth} às ${time}`}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={match.flag_home} alt={match.home_team_name} className="w-10 h-6 rounded-sm object-cover" />
                          <span className="text-sm text-gray-300">{match.home_team_name}</span>
                        </div>
                        <div className="text-3xl font-black text-white">{bet.home_score} x {bet.away_score}</div>
                        <div className="flex items-center gap-3">
                          <img src={match.flag_away} alt={match.away_team_name} className="w-10 h-6 rounded-sm object-cover" />
                          <span className="text-sm text-gray-300">{match.away_team_name}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className="rounded-full bg-dark-900 border border-dark-700 px-3 py-1">Prazo: {betChangeDeadlineLabel}</span>
                        <span className="rounded-full bg-neon-green/10 text-neon-green px-3 py-1">Clique para editar</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ================= MODAL DE LOGIN ================= */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => { setShowLoginModal(false); setSelectedMatch(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-center text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">
              {selectedMatch ? `Login para palpitar em ${selectedMatch.home_team_name} x ${selectedMatch.away_team_name}` : 'Login para enviar palpite'}
            </h3>
            {selectedMatch && (
              <p className="text-center text-sm text-gray-400 mb-3">Após entrar, você poderá registrar ou alterar o palpite deste jogo.</p>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Usuário</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Senha</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
                />
              </div>
              {loginError && (
                <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded-xl p-3">{loginError}</div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowLoginModal(false); setSelectedMatch(null); }} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-3 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-neon-green hover:bg-opacity-90 text-dark-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-neon-green/20">Entrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE PALPITE (Mantido) ================= */}
      {selectedMatch && !showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          {/* ... Código do modal continua exatamente igual ao anterior ... */}
          <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setSelectedMatch(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <h3 className="text-center text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Registrar Palpite</h3>
            <div className="text-center text-sm text-gray-400 mb-4">
              Você pode alterar ou enviar o palpite até <span className="text-neon-green font-semibold">{betChangeDeadlineLabel}</span>.
            </div>
            <form onSubmit={handleSaveBet} className="mt-4">
              <div className="flex items-center justify-between gap-4 bg-dark-900 p-4 rounded-xl border border-dark-700">
                <div className="flex flex-col items-center w-1/3 text-center">
                  <img src={selectedMatch.flag_home} alt={selectedMatch.home_team_name} className="w-12 h-8 rounded mb-1 object-cover shadow" />
                  <span className="text-xs font-bold truncate w-full">{selectedMatch.home_team_name}</span>
                  <input type="number" min="0" value={homeBet} onChange={(e) => setHomeBet(e.target.value)} className="w-16 h-12 bg-dark-800 border border-dark-700 text-center text-xl font-bold rounded-lg mt-3 focus:border-neon-green focus:outline-none text-white" />
                </div>
                <div className="text-xl font-bold text-gray-600">X</div>
                <div className="flex flex-col items-center w-1/3 text-center">
                  <img src={selectedMatch.flag_away} alt={selectedMatch.away_team_name} className="w-12 h-8 rounded mb-1 object-cover shadow" />
                  <span className="text-xs font-bold truncate w-full">{selectedMatch.away_team_name}</span>
                  <input type="number" min="0" value={awayBet} onChange={(e) => setHomeBetAway(e.target.value)} className="w-16 h-12 bg-dark-800 border border-dark-700 text-center text-xl font-bold rounded-lg mt-3 focus:border-neon-green focus:outline-none text-white" />
                </div>
              </div>
              {editingBetId && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-950 text-yellow-300 border border-yellow-900 text-sm font-medium text-center">
                  Já existe um palpite enviado para este jogo. Você pode alterar o palpite até <span className="font-semibold text-white">{betChangeDeadlineLabel}</span>.
                </div>
              )}
              {!editingBetId && isBeforeBetChangeDeadline && (
                <div className="mt-4 p-3 rounded-lg bg-blue-950 text-blue-300 border border-blue-900 text-sm font-medium text-center">
                  Use o formulário para enviar seu palpite antes de {betChangeDeadlineLabel}.
                </div>
              )}
              {!isBeforeBetChangeDeadline && (
                <div className="mt-4 p-3 rounded-lg bg-red-950 text-red-300 border border-red-900 text-sm font-medium text-center">
                  O prazo para enviar ou alterar palpites terminou em {betChangeDeadlineLabel}.
                </div>
              )}
              {statusMessage.text && (
                <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${statusMessage.type === 'success' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'}`}>{statusMessage.text}</div>
              )}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setSelectedMatch(null)} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-3 rounded-xl transition-all">Cancelar</button>
                <button type="submit" disabled={!isBeforeBetChangeDeadline} className={`flex-1 ${isBeforeBetChangeDeadline ? 'bg-neon-green hover:bg-opacity-90 text-dark-900 shadow-lg shadow-neon-green/20' : 'bg-dark-700 text-gray-500 cursor-not-allowed'} font-bold py-3 rounded-xl transition-all`}>
                  {editingBetId ? 'Alterar palpite' : 'Enviar palpite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App