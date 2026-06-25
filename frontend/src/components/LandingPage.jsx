import React, { useState } from 'react';

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
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-neon-green rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-400 rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="z-10 w-full max-w-md bg-dark-800 border border-dark-700 p-8 sm:p-10 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-neon-green tracking-tight mb-2">Bolão Copa 2026</h1>
          <p className="text-gray-400 text-sm">Faça login para entrar no seu portal de bolões e enviar seus palpites.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Usuário</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none transition-colors"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Senha</label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none transition-colors"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {loginError && (
            <div className="text-sm font-medium text-red-400 bg-red-950/50 border border-red-900/50 rounded-xl p-3 text-center">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-neon-green hover:bg-white text-dark-900 font-black text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(4,211,97,0.3)] hover:shadow-[0_0_30px_rgba(4,211,97,0.6)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin h-5 w-5 text-dark-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Conectando...</span>
              </>
            ) : 'Entrar no Bolão ⚽'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500 font-medium">
          Apenas usuários cadastrados podem participar. Peça o seu acesso ao administrador.
        </div>
      </div>
    </div>
  );
}
