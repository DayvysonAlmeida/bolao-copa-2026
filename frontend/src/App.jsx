import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBets } from './hooks/useBets';
import { DashboardTab } from './components/DashboardTab';
import { MatchesTab } from './components/MatchesTab';
import { RankingTab } from './components/RankingTab';
import { MyBetsTab } from './components/MyBetsTab';
import { BetModal } from './components/BetModal';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminPanelTab } from './components/AdminPanelTab';
import { ComparatorTab } from './components/ComparatorTab';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [matches, setMatches] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);

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
    statusMessage, setStatusMessage,
    betChangeDeadlineLabel,
    isBeforeBetChangeDeadline,
    fetchUserBets,
    getUserBetForMatch,
    handleOpenModal,
    handleSaveBet
  } = useBets(API_URL, accessToken, loggedUser, setShowLoginModal, setLoginError);

  // Modifica as funções de auth para injetar as dependências de bets (por causa de refs cruzadas)
  const onLoginSubmit = (e) => handleLoginSubmit(e, setStatusMessage, fetchUserBets);
  const onRegisterSubmit = (e) => handleRegisterSubmit(e, setStatusMessage, fetchUserBets);
  const onLogout = () => handleLogout(setUserBets, setEditingBetId, setSelectedMatch, setStatusMessage);

  const userRankPosition = isLoggedIn && ranking.length > 0 ? ranking.findIndex(user => user.id === loggedUser.id) : -1;

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_URL}/matches/`)
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
        console.error("Erro ao buscar jogos:", error);
        setIsLoading(false);
      });
  }, [API_URL]);

  useEffect(() => {
    if (activeTab === 'ranking' || activeTab === 'dashboard') {
      fetch(`${API_URL}/ranking/`)
        .then(async (response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          return Array.isArray(data) ? data : (data.results || []);
        })
        .then(data => setRanking(data))
        .catch(error => console.error("Erro ao buscar ranking:", error));
    }
  }, [activeTab, API_URL]);

  // Polling (Auto-Refresh) a cada 60 segundos para tela "ao vivo"
  useEffect(() => {
    const fetchLiveUpdates = () => {
      fetch(`${API_URL}/matches/`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          return Array.isArray(data) ? data : (data.results || []);
        })
        .then(data => setMatches(data))
        .catch(err => console.error("Erro ao atualizar jogos:", err));

      if (activeTab === 'ranking' || activeTab === 'dashboard') {
        fetch(`${API_URL}/ranking/`)
          .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return Array.isArray(data) ? data : (data.results || []);
          })
          .then(data => setRanking(data))
          .catch(err => console.error("Erro ao atualizar ranking:", err));
      }

      if (isLoggedIn && accessToken) {
        fetchUserBets(accessToken);
      }
    };

    const intervalId = setInterval(fetchLiveUpdates, 60000); // 60 segundos
    return () => clearInterval(intervalId);
  }, [API_URL, activeTab, isLoggedIn, accessToken, fetchUserBets]);

  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 p-4 sm:p-6 md:p-4 sm:p-6 md:p-8 pb-20 relative">
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
              <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-dark-700 bg-dark-900 px-4 py-3 text-gray-200 shadow-sm">
                <span className="font-semibold text-white">Olá, {loggedUser.first_name || loggedUser.username}</span>
                <button onClick={() => setShowProfileModal(true)} className="rounded-full bg-dark-700 px-4 py-2 text-white font-semibold hover:bg-dark-600 transition-all">Meu Perfil</button>
                <button onClick={onLogout} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Sair</button>
              </div>
            ) : (
              <div className="flex flex-col sm:items-end gap-2">
                <span className="text-sm text-gray-500">Clique em um jogo para entrar e palpitar.</span>
                <div className="flex gap-2">
                  {/* <button onClick={() => { setSelectedMatch(null); setShowRegisterModal(true); }} className="rounded-full bg-dark-700 border border-dark-600 px-4 py-2 text-white font-semibold hover:bg-dark-600 transition-all">Criar Conta</button> */}
                  <button onClick={() => { setSelectedMatch(null); setShowLoginModal(true); }} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Login</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mb-6 flex justify-end">
        <div className="flex flex-wrap items-center gap-2">
          {!isLoggedIn && (
            <span className="text-xs text-gray-500 mr-2">Faça login para palpitar.</span>
          )}
          <span className="rounded-full bg-dark-800 border border-dark-700 px-2.5 py-0.5 text-[10px] text-gray-500">Prazo: {betChangeDeadlineLabel}</span>
        </div>
      </div>

      {statusMessage.text && !selectedMatch && (
        <div className={`max-w-6xl mx-auto mb-6 rounded-3xl border p-4 text-sm ${statusMessage.type === 'success' ? 'bg-green-950 border-green-900 text-green-300' : 'bg-red-950 border-red-900 text-red-300'}`}>
          {statusMessage.text}
        </div>
      )}

      <nav className="flex justify-center gap-2 mb-10 flex-wrap">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${
            activeTab === 'dashboard' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          🏠 Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('matches')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${
            activeTab === 'matches' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          ⚽ Jogos
        </button>
        <button 
          onClick={() => setActiveTab('my-bets')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${
            activeTab === 'my-bets' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          📌 Meus Palpites
        </button>
        <button 
          onClick={() => setActiveTab('comparator')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${
            activeTab === 'comparator' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          🔍 Radar
        </button>
        <button 
          onClick={() => setActiveTab('ranking')}
          className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${
            activeTab === 'ranking' 
            ? 'bg-neon-green text-dark-900 shadow-[0_0_15px_rgba(4,211,97,0.4)]' 
            : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          🏆 Ranking
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-2.5 rounded-full font-bold transition-all text-sm ${
              activeTab === 'admin' 
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

      {activeTab === 'dashboard' && (
        <DashboardTab
          ranking={ranking}
          matches={matches}
          userBets={userBets}
          loggedUser={loggedUser}
          handleOpenModal={handleOpenModal}
          setActiveTab={setActiveTab}
          setShowLoginModal={setShowLoginModal}
          API_URL={API_URL}
          accessToken={accessToken}
        />
      )}

      {!isLoading && activeTab === 'matches' && (
        <MatchesTab 
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

      {activeTab === 'my-bets' && (
        <MyBetsTab 
          userBets={userBets} 
          matches={matches} 
          loggedUser={loggedUser} 
          handleOpenModal={handleOpenModal} 
          setShowRegisterModal={setShowRegisterModal} 
          setShowLoginModal={setShowLoginModal} 
          betChangeDeadlineLabel={betChangeDeadlineLabel} 
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
            fetch(`${API_URL}/matches/`).then(r => r.json()).then(setMatches);
            fetch(`${API_URL}/ranking/`).then(r => r.json()).then(setRanking);
          }}
        />
      )}

      <LoginModal 
        showLoginModal={showLoginModal} 
        setShowLoginModal={setShowLoginModal} 
        setSelectedMatch={setSelectedMatch} 
        selectedMatch={selectedMatch} 
        handleLoginSubmit={onLoginSubmit} 
        usernameInput={usernameInput} 
        setUsernameInput={setUsernameInput} 
        passwordInput={passwordInput} 
        setPasswordInput={setPasswordInput} 
        loginError={loginError} 
        setShowRegisterModal={setShowRegisterModal} 
        isLoggingIn={isLoggingIn}
      />

      <RegisterModal 
        showRegisterModal={showRegisterModal} 
        setShowRegisterModal={setShowRegisterModal} 
        setSelectedMatch={setSelectedMatch} 
        handleRegisterSubmit={onRegisterSubmit} 
        regUsername={regUsername} 
        setRegUsername={setRegUsername} 
        regFirstName={regFirstName}
        setRegFirstName={setRegFirstName}
        regLastName={regLastName}
        setRegLastName={setRegLastName}
        regEmail={regEmail}
        setRegEmail={setRegEmail}
        regPassword={regPassword} 
        setRegPassword={setRegPassword} 
        regConfirmPassword={regConfirmPassword} 
        setRegConfirmPassword={setRegConfirmPassword} 
        registerError={registerError} 
        setShowLoginModal={setShowLoginModal} 
      />

      {selectedMatch && !showLoginModal && (
        <BetModal 
          selectedMatch={selectedMatch} 
          setSelectedMatch={setSelectedMatch} 
          handleSaveBet={handleSaveBet} 
          homeBet={homeBet} 
          setHomeBet={setHomeBet} 
          awayBet={awayBet} 
          setHomeBetAway={setHomeBetAway} 
          editingBetId={editingBetId} 
          isBeforeBetChangeDeadline={isBeforeBetChangeDeadline} 
          betChangeDeadlineLabel={betChangeDeadlineLabel} 
          statusMessage={statusMessage} 
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

      <footer className="text-center py-8 mt-10 text-[10px] font-medium text-gray-600 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
        Desenvolvido por <span className="text-neon-green/80 font-bold">DayFer</span>
      </footer>
    </div>
  );
}

export default App;
