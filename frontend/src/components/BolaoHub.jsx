import React, { useState } from 'react';
import { BolaoJoinCard } from './BolaoJoinCard';

export function BolaoHub({ bolaos, onSelectBolao, API_URL, accessToken, fetchBolaos }) {
  const [selectedToJoin, setSelectedToJoin] = useState(null);

  const meusBolaos = bolaos.filter(b => b.user_confirmed);
  const disponiveis = bolaos.filter(b => !b.user_confirmed && b.allow_registration);

  const handleJoinSuccess = () => {
    setSelectedToJoin(null);
    fetchBolaos();
  };

  if (selectedToJoin) {
    return (
      <div className="animate-fadeIn">
        <button 
          onClick={() => setSelectedToJoin(null)}
          className="mb-6 text-gray-400 hover:text-white font-semibold flex items-center gap-2 transition-colors"
        >
          ⬅️ Voltar
        </button>
        <BolaoJoinCard 
          bolao={selectedToJoin} 
          accessToken={accessToken} 
          API_URL={API_URL} 
          onJoinSuccess={handleJoinSuccess} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fadeIn">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-black text-neon-green tracking-tight mb-2">Portal de Bolões</h1>
        <p className="text-gray-400 text-sm">Gerencie suas participações e descubra novos desafios.</p>
      </div>

      {/* Seção: Meus Bolões */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center sm:justify-start gap-3">
          <span>🎯</span> Meus Bolões
        </h2>
        {meusBolaos.length === 0 ? (
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 text-center text-gray-500 max-w-2xl mx-auto sm:mx-0">
            Você ainda não confirmou participação em nenhum bolão.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center sm:justify-start gap-6">
            {meusBolaos.map(bolao => (
              <div 
                key={bolao.id} 
                onClick={() => onSelectBolao(bolao)}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[350px] bg-dark-800 border border-dark-700 rounded-2xl p-6 cursor-pointer hover:border-neon-green hover:shadow-[0_0_20px_rgba(4,211,97,0.15)] transition-all group relative overflow-hidden flex flex-col text-left"
              >
                {bolao.is_active && (
                  <div className="absolute top-0 right-0 bg-neon-green text-dark-900 text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-wider z-10">
                    ATIVO AGORA
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-green transition-colors pr-16">{bolao.name}</h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-2">{bolao.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="text-xs text-gray-500 font-medium bg-dark-900 px-3 py-1 rounded-full border border-dark-700">
                    {bolao.scoring_mode === 'KNOCKOUT' ? '⚔️ Mata-Mata' : '🏆 Padrão'}
                  </span>
                  <span className="text-neon-green font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Entrar <span>→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Seção: Bolões Disponíveis */}
      {disponiveis.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center sm:justify-start gap-3">
            <span>✨</span> Novos Bolões Disponíveis
          </h2>
          <div className="flex flex-wrap justify-center sm:justify-start gap-6">
            {disponiveis.map(bolao => (
              <div 
                key={bolao.id} 
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[350px] bg-dark-800/50 border border-dark-700 border-dashed rounded-2xl p-6 relative overflow-hidden flex flex-col text-left"
              >
                <h3 className="text-xl font-bold text-white mb-2 opacity-90">{bolao.name}</h3>
                <p className="text-sm text-gray-400 mb-6 line-clamp-2 opacity-80">{bolao.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4">
                  <span className="text-xs text-gray-500 font-medium">
                    {bolao.participants_count} participantes
                  </span>
                  <button 
                    onClick={() => setSelectedToJoin(bolao)}
                    className="bg-yellow-400 text-dark-900 text-sm font-bold px-4 py-2 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-400/20"
                  >
                    Participar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
