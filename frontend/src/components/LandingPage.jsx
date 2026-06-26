import React from 'react';
import { motion } from 'framer-motion';

export function LandingPage({
  handleLoginSubmit,
  usernameInput,
  setUsernameInput,
  passwordInput,
  setPasswordInput,
  loginError,
  isLoggingIn
}) {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">

      {/* Elementos Decorativos de Fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-neon-green/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
        {/* Grid sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPjwvc3ZnPg==')] opacity-50"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-5xl bg-dark-800/60 backdrop-blur-2xl border border-dark-600/50 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        {/* Lado Esquerdo - Branding (Visível apenas em Desktop) */}
        <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900 border-r border-dark-700/50">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-neon-green/20 rounded-full blur-[80px]"></div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mb-16"
            >
              <span className="text-4xl">⚽</span>
              <span className="text-xl font-bold tracking-widest text-gray-400 uppercase">Bolão Pro League</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6 tracking-tight">
                A Glória Eterna<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-yellow-400">
                  Te Espera.
                </span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
                Desafie seus amigos, prove que você entende de futebol e eternize seu nome no topo do ranking.
              </p>
            </motion.div>
          </div>

          {/* Cards Flutuantes de Efeito Decorativo */}
          <div className="relative z-10 mt-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="bg-dark-900/80 backdrop-blur-md border border-dark-700 p-4 rounded-2xl w-64 shadow-2xl flex items-center gap-4 transform -rotate-6 ml-8"
            >
              <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center text-2xl border border-yellow-400/30">🏆</div>
              <div>
                <div className="text-white font-bold text-sm">1º Lugar no Ranking</div>
                <div className="text-neon-green text-xs font-black">Você subiu +3 posições!</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Lado Direito - Formulário de Login */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative">
          <div className="md:hidden flex items-center justify-center gap-3 mb-8">
            <span className="text-3xl">⚽</span>
            <span className="text-2xl font-black text-white tracking-tight">Bolão <span className="text-neon-green">2026</span></span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h2>
            <p className="text-gray-400 text-sm mb-10">Insira suas credenciais para acessar a arena.</p>

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 ml-1">Nome de Usuário</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 group-focus-within:text-neon-green transition-colors">👤</span>
                  </div>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full bg-dark-900/50 border border-dark-600 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner"
                    placeholder="Seu usuário épico"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 ml-1">Senha Secreta</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 group-focus-within:text-neon-green transition-colors">🔒</span>
                  </div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-dark-900/50 border border-dark-600 text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green transition-all shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
                >
                  <span className="text-lg">⚠️</span>
                  {loginError}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-neon-green to-emerald-500 hover:from-white hover:to-gray-200 text-dark-900 font-black text-lg py-4 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(4,211,97,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 group"
              >
                {isLoggingIn ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    Entrar na Arena <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-dark-700/50 text-center">
              <p className="text-gray-500 text-xs leading-relaxed">
                Acesso restrito a convidados VIPs.<br />
                Para solicitar acesso, entre em contato com o administrador do bolão.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
