import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBets } from './hooks/useBets';
import { MatchesTab } from './components/MatchesTab';
import { RankingTab } from './components/RankingTab';
import { MyBetsTab } from './components/MyBetsTab';
import { BetModal } from './components/BetModal';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';

function App() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const [matches, setMatches] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  const {
    usernameInput, setUsernameInput,
    passwordInput, setPasswordInput,
    loginError, setLoginError,
    accessToken,
    loggedUser,
    showLoginModal, setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    regUsername, setRegUsername,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    registerError, setRegisterError,
    isLoggedIn,
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
      .then(response => response.json())
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
    if (activeTab === 'ranking') {
      fetch(`${API_URL}/ranking/`)
        .then(response => response.json())
        .then(data => setRanking(data))
        .catch(error => console.error("Erro ao buscar ranking:", error));
    }
  }, [activeTab, API_URL]);

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
                <button onClick={onLogout} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Sair</button>
              </div>
            ) : (
              <div className="flex flex-col sm:items-end gap-2">
                <span className="text-sm text-gray-500">Clique em um jogo para entrar e palpitar.</span>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedMatch(null); setShowRegisterModal(true); }} className="rounded-full bg-dark-700 border border-dark-600 px-4 py-2 text-white font-semibold hover:bg-dark-600 transition-all">Criar Conta</button>
                  <button onClick={() => { setSelectedMatch(null); setShowLoginModal(true); }} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Login</button>
                </div>
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

      {isLoading && activeTab === 'matches' && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-dark-700 border-t-neon-green rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">Acordando o servidor...</h3>
          <p className="text-gray-400 text-sm max-w-md text-center">Como estamos em um servidor gratuito, o primeiro carregamento pode levar até 50 segundos. Obrigado pela paciência! ⚽</p>
        </div>
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
      />

      <RegisterModal 
        showRegisterModal={showRegisterModal} 
        setShowRegisterModal={setShowRegisterModal} 
        setSelectedMatch={setSelectedMatch} 
        handleRegisterSubmit={onRegisterSubmit} 
        regUsername={regUsername} 
        setRegUsername={setRegUsername} 
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
    </div>
  );
}

export default App;