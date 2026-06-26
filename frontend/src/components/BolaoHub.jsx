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

  const getCardTheme = (id) => {
    const themes = [
      { bg: 'from-neon-green/20 to-transparent', border: 'border-neon-green/30 group-hover:border-neon-green', text: 'text-neon-green', shadow: 'hover:shadow-[0_0_30px_rgba(4,211,97,0.15)]' },
      { bg: 'from-blue-500/20 to-transparent', border: 'border-blue-500/30 group-hover:border-blue-500', text: 'text-blue-500', shadow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]' },
      { bg: 'from-purple-500/20 to-transparent', border: 'border-purple-500/30 group-hover:border-purple-500', text: 'text-purple-500', shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]' },
      { bg: 'from-orange-500/20 to-transparent', border: 'border-orange-500/30 group-hover:border-orange-500', text: 'text-orange-500', shadow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]' },
      { bg: 'from-pink-500/20 to-transparent', border: 'border-pink-500/30 group-hover:border-pink-500', text: 'text-pink-500', shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]' }
    ];
    return themes[id % themes.length];
  };

  if (selectedToJoin) {
    return (
      <div className="animate-fadeIn relative z-10">
        <button 
          onClick={() => setSelectedToJoin(null)}
          className="mb-6 text-gray-400 hover:text-white font-semibold flex items-center gap-2 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Lobby
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
    <div className="max-w-[1400px] mx-auto pb-12 animate-fadeIn relative">
      {/* Background Decorativo */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-neon-green/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-[200px] right-[-100px] w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <div className="mb-14 text-center sm:text-left mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-dark-800/80 backdrop-blur-sm border border-dark-700 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">🎮</span>
        </div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight mb-3">
          Portal de Bolões
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          Gerencie suas participações, acompanhe seus resultados e descubra novos desafios na comunidade.
        </p>
      </div>

      {/* Seção: Meus Bolões */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-green/20 to-neon-green/5 border border-neon-green/30 flex items-center justify-center">
            <span className="text-neon-green text-xl">🎯</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Meus Bolões</h2>
        </div>

        {meusBolaos.length === 0 ? (
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 border-dashed rounded-3xl p-12 text-center max-w-3xl mx-auto sm:mx-0 flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-6xl mb-4 opacity-50 grayscale">🏟️</span>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Nenhum bolão ativo</h3>
            <p className="text-gray-500">Você ainda não confirmou participação em nenhum bolão. Explore as opções abaixo e entre no jogo!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {meusBolaos.map((bolao, index) => {
              const theme = getCardTheme(bolao.id);
              return (
                <div 
                  key={bolao.id} 
                  onClick={() => onSelectBolao(bolao)}
                  className={`bg-dark-800 backdrop-blur-md border border-dark-700 rounded-3xl p-6 cursor-pointer transition-all duration-300 group relative overflow-hidden flex flex-col text-left hover:-translate-y-1 ${theme.shadow} bg-gradient-to-b ${theme.bg}`}
                  style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`}></div>

                  {(() => {
                    let badge = null;
                    if (bolao.status === 'LOCKED') {
                      badge = { text: 'Em Andamento', bg: 'bg-neon-green', color: 'text-dark-900', shadow: 'shadow-neon-green/20' };
                    } else if (bolao.status === 'FINISHED') {
                      badge = { text: 'Finalizado', bg: 'bg-gray-600', color: 'text-white', shadow: 'shadow-gray-600/20' };
                    } else if (bolao.status === 'OPEN') {
                      badge = { text: 'Em Breve', bg: 'bg-blue-500', color: 'text-white', shadow: 'shadow-blue-500/20' };
                    }

                    if (!badge) return null;

                    return (
                      <div className={`absolute top-0 right-0 ${badge.bg} ${badge.color} text-[9px] font-black px-3 py-1.5 rounded-bl-2xl tracking-widest z-10 uppercase shadow-lg ${badge.shadow}`}>
                        {badge.text}
                      </div>
                    );
                  })()}
                  
                  <div className={`w-12 h-12 rounded-2xl bg-dark-900/50 border border-dark-700 flex items-center justify-center mb-4 ${theme.text} text-2xl group-hover:scale-110 transition-transform`}>
                    {bolao.scoring_mode === 'KNOCKOUT' ? '⚔️' : '🏆'}
                  </div>

                  <h3 className="text-2xl font-black text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all pr-12 line-clamp-2">
                    {bolao.name}
                  </h3>
                  
                  <p className="text-sm text-gray-400 mb-8 line-clamp-2 leading-relaxed">
                    {bolao.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-dark-700/50 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Modo</span>
                      <span className="text-xs text-gray-300 font-semibold mt-0.5">
                        {bolao.scoring_mode === 'KNOCKOUT' ? 'Mata-Mata' : 'Padrão'}
                      </span>
                    </div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-dark-900/80 border ${theme.border} group-hover:bg-white group-hover:border-white transition-colors`}>
                      <span className={`font-black ${theme.text} group-hover:text-dark-900 transition-colors`}>
                        →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Seção: Bolões Disponíveis */}
      {disponiveis.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 border border-yellow-400/30 flex items-center justify-center">
              <span className="text-yellow-400 text-xl">✨</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Convites VIP</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {disponiveis.map((bolao, index) => (
              <div 
                key={bolao.id} 
                className="bg-dark-800/40 backdrop-blur-sm border border-yellow-400/20 border-dashed rounded-3xl p-6 relative overflow-hidden flex flex-col text-left group hover:bg-dark-800/60 transition-colors"
                style={{ animation: `fadeInUp 0.5s ease-out ${(meusBolaos.length + index) * 0.1}s both` }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/5 rounded-full blur-[30px]"></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20">
                    🎟️
                  </div>
                  <span className="bg-dark-900 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-dark-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {bolao.participants_count} JOGADORES
                  </span>
                </div>

                <h3 className="text-xl font-black text-white mb-2 leading-tight">{bolao.name}</h3>
                <p className="text-sm text-gray-400 mb-8 line-clamp-2">{bolao.description}</p>
                
                <div className="mt-auto pt-4">
                  <button 
                    onClick={() => setSelectedToJoin(bolao)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-dark-900 text-sm font-black px-4 py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] flex items-center justify-center gap-2"
                  >
                    Aceitar Convite <span>🤝</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Global Style para as animações */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
