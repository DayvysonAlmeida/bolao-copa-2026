import { useState } from 'react';
import { MatchCard } from './MatchCard';

export function MatchesTab({ matches, loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel }) {
  const [filter, setFilter] = useState('all');

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'no_bet') return loggedUser && !getUserBetForMatch(match.id) && match.status !== 'FINISHED';
    if (filter === 'finished') return match.status === 'FINISHED';
    return true;
  });

  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const groupName = match.group ? `Grupo ${match.group}` : 'Fase Final';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(match);
    return acc;
  }, {});
  
  const sortedGroups = Object.keys(groupedMatches).sort();

  return (
    <main className="max-w-6xl mx-auto flex flex-col gap-6 animate-fadeIn">
      
      {/* Barra de Filtros */}
      <div className="flex flex-wrap gap-2 justify-center mb-0">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'all' ? 'bg-neon-green text-dark-900 shadow-[0_0_10px_rgba(4,211,97,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
        >
          Todos os Jogos
        </button>
        {loggedUser && (
          <button 
            onClick={() => setFilter('no_bet')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'no_bet' ? 'bg-yellow-400 text-dark-900 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
          >
            Faltam Palpitar
          </button>
        )}
        <button 
          onClick={() => setFilter('finished')}
          className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'finished' ? 'bg-gray-300 text-dark-900 shadow-[0_0_10px_rgba(209,213,219,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
        >
          Encerrados
        </button>
      </div>

      {sortedGroups.length === 0 && (
        <div className="text-center text-gray-500 py-10">Nenhum jogo encontrado para este filtro.</div>
      )}

      {sortedGroups.map(groupName => (
        <section key={groupName}>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-200 bg-dark-800 px-5 py-2 rounded-full border border-dark-700 shadow-md">
              {groupName}
            </h2>
            <div className="flex-1 h-px bg-dark-700"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedMatches[groupName].map(match => (
              <MatchCard 
                key={match.id}
                match={match}
                userBet={loggedUser ? getUserBetForMatch(match.id) : null}
                loggedUser={loggedUser}
                handleOpenModal={handleOpenModal}
                betChangeDeadlineLabel={betChangeDeadlineLabel}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
