import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBets } from './hooks/useBets';
import { DashboardTab } from './components/DashboardTab';
import { MatchesTab } from './components/MatchesTab';
import { RankingTab } from './components/RankingTab';
import { BetModal } from './components/BetModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminPanelTab } from './components/AdminPanelTab';
import { ComparatorTab } from './components/ComparatorTab';
import { BracketTab } from './components/BracketTab';
import { BolaoJoinCard } from './components/BolaoJoinCard';

import { LandingPage } from './components/LandingPage';
import { BolaoHub } from './components/BolaoHub';
import { FloatingChat } from './components/FloatingChat';
import { WinnerModal } from './components/WinnerModal';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [matches, setMatches] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeBolao, setActiveBolao] = useState(() => {
    const saved = localStorage.getItem('activeBolao');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeBolao) {
      localStorage.setItem('activeBolao', JSON.stringify(activeBolao));
      if (activeBolao.scoring_mode !== 'KNOCKOUT' && activeTab === 'bracket') {
        setActiveTab('matches');
      }
    } else {
      localStorage.removeItem('activeBolao');
    }
  }, [activeBolao, activeTab]);
  const [allBolaos, setAllBolaos] = useState([]);

  const {
    usernameInput, setUsernameInput,
    passwordInput, setPasswordInput,
    loginError, setLoginError,
    accessToken,
    loggedUser, setLoggedUser,
    showLoginModal, setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    regUsername, setRegUsername,
    regFirstName, setRegFirstName,
    regLastName, setRegLastName,
    regEmail, setRegEmail,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    registerError, setRegisterError,
    isLoggedIn, isLoggingIn, isAdmin,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout
  } = useAuth(API_URL);

  const {
    userBets, setUserBets,
    editingBetId, setEditingBetId,
    selectedMatch, setSelectedMatch,
    homeBet, setHomeBet,
    awayBet, setHomeBetAway,
    penaltyWinner, setPenaltyWinner,
    statusMessage, setStatusMessage,
    betChangeDeadlineLabel,
    isBeforeBetChangeDeadline,
    fetchUserBets,
    getUserBetForMatch,
    handleOpenModal,
    handleSaveBet
  } = useBets(API_URL, accessToken, loggedUser, setShowLoginModal, setLoginError, activeBolao);

  // Modifica as funções de auth para injetar as dependências de bets (por causa de refs cruzadas)
  const onLoginSubmit = (e) => handleLoginSubmit(e, setStatusMessage, fetchUserBets);
  const onRegisterSubmit = (e) => handleRegisterSubmit(e, setStatusMessage, fetchUserBets);
  const onLogout = () => handleLogout(setUserBets, setEditingBetId, setSelectedMatch, setStatusMessage);

  const userRankPosition = isLoggedIn && ranking.length > 0 ? ranking.findIndex(user => user.id === loggedUser.id) : -1;

  // Função para buscar todos os bolões
  const fetchBolaos = () => {
    fetch(`${API_URL}/bolaos/`, {
      headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : data.results || [];
        setAllBolaos(arr);
        // Atualiza o activeBolao caso seu status tenha mudado no backend
        setActiveBolao(prev => {
          if (prev) {
            const updated = arr.find(b => b.id === prev.id);
            if (updated && updated.status !== prev.status) return updated;
          }
          return prev;
        });
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBolaos();
    }
  }, [isLoggedIn, accessToken, API_URL]);

  useEffect(() => {
    if (activeBolao) {
      setIsLoading(true);
      fetch(`${API_URL}/bolaos/${activeBolao.id}/matches/`)
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          return Array.isArray(data) ? data : (data.results || []);
        })
        .then(data => {
          setMatches(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error("Erro ao buscar jogos/bolão:", error);
          setIsLoading(false);
        });

      if (activeTab === 'ranking' || activeTab === 'dashboard') {
        fetch(`${API_URL}/bolaos/${activeBolao.id}/ranking/`)
          .then(async (response) => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return Array.isArray(data) ? data : (data.results || []);
          })
          .then(data => {
            setRanking(data);
            // Verifica se o bolão acabou e se o usuário atual tem posição no ranking
            if (activeBolao.status === 'FINISHED' && data.some(u => u.id === loggedUser?.id)) {
              setShowWinnerModal(true);
            }
          })
          .catch(error => console.error("Erro ao buscar ranking:", error));
      }
    }
  }, [activeBolao, activeTab, API_URL, loggedUser]);

  // Polling (Auto-Refresh) a cada 60 segundos para tela "ao vivo"
  useEffect(() => {
    const fetchLiveUpdates = () => {
      if (isLoggedIn) {
        fetchBolaos(); // Atualiza a lista de bolões no Hub
      }

      if (activeBolao) {
        fetch(`${API_URL}/bolaos/${activeBolao.id}/matches/`)
          .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return Array.isArray(data) ? data : (data.results || []);
          })
          .then(data => setMatches(data))
          .catch(err => console.error("Erro ao atualizar jogos:", err));

        if (activeTab === 'ranking' || activeTab === 'dashboard') {
          fetch(`${API_URL}/bolaos/${activeBolao.id}/ranking/`)
            .then(async (res) => {
              if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
              const data = await res.json();
              return Array.isArray(data) ? data : (data.results || []);
            })
            .then(data => setRanking(data))
            .catch(err => console.error("Erro ao atualizar ranking:", err));
        }
      }

      if (isLoggedIn && accessToken) {
        fetchUserBets(accessToken);
      }
    };

    const intervalId = setInterval(fetchLiveUpdates, 60000); // 60 segundos
    return () => clearInterval(intervalId);
  }, [API_URL, activeTab, isLoggedIn, accessToken, activeBolao, fetchUserBets]);

  if (!isLoggedIn) {
    return (
      <LandingPage
        handleLoginSubmit={onLoginSubmit}
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
      />
    );
  }

  if (isLoggedIn && !activeBolao) {
    return (
      <div className="min-h-screen bg-dark-900 text-gray-100 p-4 sm:p-6 md:p-4 sm:p-6 md:p-8 pb-20 relative">
        <header className="mb-8 flex justify-between items-center bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 p-4 rounded-3xl relative md:sticky md:top-4 z-40 shadow-2xl">
          <div className="flex items-center gap-3 pl-2">
            <span className="text-3xl">⚽</span>
            <span className="text-xl font-black text-white tracking-tight hidden sm:block">Bolão <span className="text-neon-green">Copa - 2026</span></span>
          </div>
          <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3">
              <span className="font-semibold text-gray-400 text-sm">Olá, <span className="text-white">{loggedUser.first_name || loggedUser.username}</span></span>
            </div>
            <button onClick={() => setShowProfileModal(true)} className="rounded-xl bg-dark-700/80 px-4 py-2 text-gray-300 text-sm font-bold hover:bg-dark-600 hover:text-white transition-all border border-dark-600">Meu Perfil</button>
            <button onClick={onLogout} className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 text-sm font-bold hover:bg-red-500 hover:text-white transition-all">Sair</button>
          </div>
        </header>

        <BolaoHub
          bolaos={allBolaos}
          onSelectBolao={(bolao) => {
            setActiveBolao(bolao);
            // Se for Mata-Mata, abre direto no chaveamento
            setActiveTab(bolao.scoring_mode === 'KNOCKOUT' ? 'bracket' : 'dashboard');
          }}
          API_URL={API_URL}
          accessToken={accessToken}
          fetchBolaos={fetchBolaos}
        />

        <ProfileModal
          showProfileModal={showProfileModal}
          setShowProfileModal={setShowProfileModal}
          loggedUser={loggedUser}
          setLoggedUser={setLoggedUser}
          accessToken={accessToken}
          API_URL={API_URL}
        />
        <footer className="text-center py-8 mt-10 text-[10px] font-medium text-gray-600 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
          Desenvolvido por <span className="text-neon-green/80 font-bold">DayFer</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 p-4 sm:p-6 md:p-4 sm:p-6 md:p-8 pb-20 relative">
      <header className="mb-8 bg-dark-800/60 backdrop-blur-xl border border-dark-700/50 p-5 sm:p-6 rounded-3xl relative md:sticky md:top-4 z-40 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <button
              onClick={() => { setActiveBolao(null); fetchBolaos(); }}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-dark-900/50 text-gray-400 hover:text-white hover:bg-dark-700 transition-all border border-dark-600 shadow-inner group"
              title="Voltar ao Lobby"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight flex items-center gap-3">
                {activeBolao ? activeBolao.name : "Bolão Copa 2026"}
                {activeBolao && activeBolao.status === 'LOCKED' && (
                  <span className="bg-neon-green text-dark-900 text-[10px] uppercase font-black px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(4,211,97,0.3)]">Em Andamento</span>
                )}
                {activeBolao && activeBolao.status === 'FINISHED' && (
                  <span className="bg-gray-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(75,85,99,0.3)]">Finalizado</span>
                )}
                {activeBolao && activeBolao.status === 'OPEN' && (
                  <span className="bg-blue-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(59,130,246,0.3)]">Em Breve</span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                {activeBolao && activeBolao.scoring_mode === 'KNOCKOUT'
                  ? "Mata-Mata: Valem os 90 minutos! Placar exato = 5 pts, Acertar vencedor = 3 pts."
                  : activeBolao?.description || "Acompanhe os resultados e suba no ranking!"}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            {loggedUser && (
              <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 bg-dark-900/40 p-2 rounded-2xl border border-dark-700/50">
                <div className="hidden md:flex items-center gap-2 pl-2 pr-2">
                  <div className="w-8 h-8 rounded-full bg-neon-green/20 border border-neon-green/30 flex items-center justify-center text-neon-green font-black text-xs shadow-inner">
                    {(loggedUser.first_name || loggedUser.username)[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-gray-200 text-sm">{loggedUser.first_name || loggedUser.username}</span>
                </div>
                <button onClick={() => setShowProfileModal(true)} className="rounded-xl bg-dark-700/80 px-4 py-2 text-gray-300 text-xs sm:text-sm font-bold hover:bg-dark-600 hover:text-white transition-all">Perfil</button>
                <button onClick={onLogout} className="rounded-xl bg-neon-green text-dark-900 px-4 py-2 text-xs sm:text-sm font-black hover:bg-white transition-all shadow-[0_0_15px_rgba(4,211,97,0.3)]">Sair</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mb-6 flex justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-dark-800 border border-dark-700 px-2.5 py-0.5 text-[10px] text-gray-500">Prazo: {betChangeDeadlineLabel}</span>
        </div>
      </div>

      {statusMessage.text && !selectedMatch && (
        <div className={`max-w-6xl mx-auto mb-6 rounded-3xl border p-4 text-sm ${statusMessage.type === 'success' ? 'bg-green-950 border-green-900 text-green-300' : 'bg-red-950 border-red-900 text-red-300'}`}>
          {statusMessage.text}
        </div>
      )}

      <nav className="flex justify-center gap-2 mb-10 flex-wrap">
        {activeBolao && activeBolao.scoring_mode === 'KNOCKOUT' && (
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${activeTab === 'bracket'
                ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]'
                : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
          >
            🏆 Chaveamento
          </button>
        )}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${activeTab === 'dashboard'
              ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]'
              : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
        >
          🏠 Dashboard
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${activeTab === 'matches'
              ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]'
              : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
        >
          ⚽ Jogos
        </button>

        <button
          onClick={() => setActiveTab('comparator')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${activeTab === 'comparator'
              ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]'
              : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
        >
          🔍 Radar
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${activeTab === 'ranking'
              ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]'
              : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
            }`}
        >
          🏆 Ranking
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${activeTab === 'admin'
                ? 'bg-yellow-400 text-dark-900 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                : 'bg-dark-800 text-yellow-500/70 hover:text-yellow-400 hover:bg-dark-700'
              }`}
          >
            ⚖️ Área do Juiz
          </button>
        )}
      </nav>

      {isLoading && activeTab === 'matches' && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-neon-green rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">Acordando o servidor...</h3>
          <p className="text-gray-400 text-sm max-w-md text-center">Como estamos em um servidor gratuito, o primeiro carregamento pode levar até 50 segundos. Obrigado pela paciência! ⚽</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && (
            <DashboardTab
              ranking={ranking}
              matches={matches}
              userBets={userBets}
              loggedUser={loggedUser}
              handleOpenModal={handleOpenModal}
              setActiveTab={setActiveTab}
              API_URL={API_URL}
              accessToken={accessToken}
              activeBolao={activeBolao}
            />
          )}

          {!isLoading && activeTab === 'matches' && (
            <MatchesTab
              matches={matches}
              loggedUser={loggedUser}
              getUserBetForMatch={getUserBetForMatch}
              handleOpenModal={handleOpenModal}
              betChangeDeadlineLabel={betChangeDeadlineLabel}
              activeBolao={activeBolao}
            />
          )}

          {activeTab === 'bracket' && (
            <BracketTab
              matches={matches}
              loggedUser={loggedUser}
              getUserBetForMatch={getUserBetForMatch}
              handleOpenModal={handleOpenModal}
              betChangeDeadlineLabel={betChangeDeadlineLabel}
            />
          )}

          {activeTab === 'ranking' && (
            <RankingTab
              ranking={ranking}
              loggedUser={loggedUser}
              userRankPosition={userRankPosition}
            />
          )}

          {activeTab === 'comparator' && (
            <ComparatorTab
              matches={matches}
              ranking={ranking}
              loggedUser={loggedUser}
              API_URL={API_URL}
              accessToken={accessToken}
            />
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminPanelTab
              matches={matches}
              users={ranking}
              API_URL={API_URL}
              accessToken={accessToken}
              onSuccess={() => {
                // Recarrega jogos e ranking após lançar palpite
                const endpointMatches = activeBolao ? `${API_URL}/bolaos/${activeBolao.id}/matches/` : `${API_URL}/matches/`;
                const endpointRanking = activeBolao ? `${API_URL}/bolaos/${activeBolao.id}/ranking/` : `${API_URL}/ranking/`;
                fetch(endpointMatches).then(r => r.json()).then(setMatches);
                fetch(endpointRanking).then(r => r.json()).then(setRanking);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {selectedMatch && (
        <BetModal
          selectedMatch={selectedMatch}
          setSelectedMatch={setSelectedMatch}
          handleSaveBet={handleSaveBet}
          homeBet={homeBet}
          setHomeBet={setHomeBet}
          awayBet={awayBet}
          setHomeBetAway={setHomeBetAway}
          penaltyWinner={penaltyWinner}
          setPenaltyWinner={setPenaltyWinner}
          editingBetId={editingBetId}
          isBeforeBetChangeDeadline={isBeforeBetChangeDeadline}
          betChangeDeadlineLabel={betChangeDeadlineLabel}
          statusMessage={statusMessage}
          activeBolao={activeBolao}
        />
      )}

      {showWinnerModal && activeBolao && ranking.length > 0 && (
        <WinnerModal
          bolao={activeBolao}
          ranking={ranking}
          loggedUser={loggedUser}
          onClose={() => setShowWinnerModal(false)}
        />
      )}

      <ProfileModal
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        loggedUser={loggedUser}
        setLoggedUser={setLoggedUser}
        accessToken={accessToken}
        API_URL={API_URL}
      />

      <FloatingChat
        activeBolao={activeBolao}
        API_URL={API_URL}
        accessToken={accessToken}
        loggedUser={loggedUser}
      />

      <footer className="text-center py-8 mt-10 text-[10px] font-medium text-gray-600 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
        Desenvolvido por <span className="text-neon-green/80 font-bold">DayFer</span>
      </footer>
    </div>
  );
}

export default App;
