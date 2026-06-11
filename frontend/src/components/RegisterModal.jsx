export function RegisterModal({ 
  showRegisterModal, 
  setShowRegisterModal, 
  setSelectedMatch, 
  handleRegisterSubmit, 
  regUsername, 
  setRegUsername, 
  regPassword, 
  setRegPassword, 
  regConfirmPassword, 
  setRegConfirmPassword, 
  registerError, 
  setShowLoginModal 
}) {
  if (!showRegisterModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button onClick={() => { setShowRegisterModal(false); setSelectedMatch(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        <h3 className="text-center text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">
          Criar nova conta
        </h3>
        <p className="text-center text-sm text-gray-400 mb-4">Crie sua conta para participar do bolão.</p>
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Usuário</label>
            <input
              type="text"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              placeholder="Ex: joao.silva"
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Senha</label>
            <input
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
            />
          </div>
          {registerError && (
            <div className="text-sm text-red-400 bg-red-950 border border-red-900 rounded-xl p-3">{registerError}</div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setShowRegisterModal(false); setSelectedMatch(null); }} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-3 rounded-xl transition-all">Cancelar</button>
            <button type="submit" className="flex-1 bg-neon-green hover:bg-opacity-90 text-dark-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-neon-green/20">Cadastrar</button>
          </div>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-400">Já tem conta? </span>
            <button type="button" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className="text-sm text-neon-green font-semibold hover:underline">Faça login</button>
          </div>
        </form>
      </div>
    </div>
  );
}
