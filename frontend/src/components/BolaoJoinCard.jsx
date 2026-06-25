import React, { useState } from 'react';

export function BolaoJoinCard({ bolao, accessToken, API_URL, onJoinSuccess }) {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async () => {
    setIsJoining(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/bolaos/${bolao.id}/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao entrar no bolão.');
      }
      onJoinSuccess(data);
    } catch (err) {
      setError(err.message);
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-12 bg-dark-800 border border-neon-green/30 rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(4,211,97,0.1)] relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-neon-green rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-10 pointer-events-none"></div>

      <div className="relative z-10">
        <h2 className="text-3xl font-black text-white mb-2">🏆 {bolao.name}</h2>
        <p className="text-gray-400 mb-8">{bolao.description}</p>

        {bolao.scoring_mode === 'KNOCKOUT' && (
          <div className="bg-dark-900/50 border border-dark-700 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-yellow-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
              <span className="text-xl">⚠️</span> Regras Especiais de Mata-Mata
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-0.5 text-lg">🎯</span>
                <span><strong>5 Pontos:</strong> Cravar o placar exato dos 90 minutos.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 mt-0.5 text-lg">✓</span>
                <span><strong>3 Pontos:</strong> Acertar o vencedor da partida nos 90 minutos.</span>
              </li>
              <li className="flex gap-3 bg-neon-green/10 border border-neon-green/20 p-3 rounded-xl mt-4">
                <span className="flex-shrink-0 mt-0.5 text-lg">🏆</span>
                <div>
                  <span className="text-neon-green font-bold block mb-1">NOVIDADE: Pênaltis! (8 Pontos)</span>
                  <span>Ao palpitar empate, você escolhe quem passa nos pênaltis. Se cravar o empate E acertar o classificado: <strong>8 pontos!</strong></span>
                </div>
              </li>
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-red-950/50 border border-red-900 text-red-400 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full sm:w-auto bg-neon-green text-dark-900 font-black text-lg px-8 py-4 rounded-full hover:bg-white hover:shadow-[0_0_20px_rgba(4,211,97,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? "Entrando..." : "Quero Participar! ⚽"}
        </button>
      </div>
    </div>
  );
}
