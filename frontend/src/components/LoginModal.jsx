export function LoginModal({ 
  showLoginModal, 
  setShowLoginModal, 
  setSelectedMatch, 
  selectedMatch, 
  handleLoginSubmit, 
  usernameInput, 
  setUsernameInput, 
  passwordInput, 
  setPasswordInput, 
  loginError, 
  setShowRegisterModal,
  isLoggingIn
}) {
  if (!showLoginModal) return null;

  return (
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
            <button type="button" onClick={() => { setShowLoginModal(false); setSelectedMatch(null); }} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-3 rounded-xl transition-all" disabled={isLoggingIn}>Cancelar</button>
            <button type="submit" disabled={isLoggingIn} className="flex-1 bg-neon-green hover:bg-opacity-90 text-dark-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-neon-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Conectando...</span>
                </>
              ) : 'Entrar'}
            </button>
          </div>
          {/* <div className="mt-4 text-center">
            <span className="text-sm text-gray-400">Não tem conta? </span>
            <button type="button" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className="text-sm font-semibold text-neon-green hover:underline">
              Criar conta
            </button>
          </div> */}
        </form>
      </div>
    </div>
  );
}
