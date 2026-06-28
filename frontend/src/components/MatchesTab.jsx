import { useState } from 'react';
import { MatchCard } from './MatchCard';

export function MatchesTab({ matches, loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel, activeBolao }) {
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Extrair todas as datas únicas para o select
  const uniqueDates = [...new Set(matches.map(m => new Date(m.match_date).toLocaleDateString('pt-BR')))].sort((a, b) => {
    const [d1, m1, y1] = a.split('/');
    const [d2, m2, y2] = b.split('/');
    return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
  });

  const filteredMatches = matches.filter(match => {
    // Filtro de Status
    let passStatus = true;
    if (filter === 'no_bet') passStatus = loggedUser && !getUserBetForMatch(match.id) && match.status !== 'FINISHED';
    if (filter === 'already_betted') passStatus = loggedUser && !!getUserBetForMatch(match.id);
    if (filter === 'finished') passStatus = match.status === 'FINISHED';
    if (filter === 'pending') passStatus = match.status === 'PENDING';
    
    // Filtro de Data
    let passDate = true;
    if (dateFilter !== 'all') {
      passDate = new Date(match.match_date).toLocaleDateString('pt-BR') === dateFilter;
    }

    return passStatus && passDate;
  });

  const getPhaseName = (phase) => {
    const phases = {
      'ROUND_32': '16-avos de Final',
      'ROUND_16': 'Oitavas de Final',
      'QUARTER_FINALS': 'Quartas de Final',
      'SEMI_FINALS': 'Semifinais',
      'THIRD_PLACE': 'Disputa do 3º Lugar',
      'FINAL': 'Final',
      'GROUP_STAGE': 'Fase de Grupos'
    };
    return phases[phase] || 'Fase Final';
  };

  const groupedMatches = filteredMatches.reduce((acc, match) => {
    let groupName;
    const isKnockout = activeBolao ? activeBolao.scoring_mode === 'KNOCKOUT' : match.scoring_mode === 'KNOCKOUT';

    if (isKnockout) {
       groupName = getPhaseName(match.phase);
    } else {
       groupName = match.group && match.group !== '-' ? `Grupo ${match.group}` : 'Fase de Grupos';
    }
    
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(match);
    return acc;
  }, {});
  
  const phaseOrder = [
    'Fase de Grupos',
    '16-avos de Final',
    'Oitavas de Final',
    'Quartas de Final',
    'Semifinais',
    'Disputa do 3º Lugar',
    'Final',
  ];

  const sortedGroups = Object.keys(groupedMatches).sort((a, b) => {
    const indexA = phaseOrder.indexOf(a);
    const indexB = phaseOrder.indexOf(b);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return 1;
    if (indexB !== -1) return -1;
    
    return a.localeCompare(b);
  });

  return (
    <main className="max-w-6xl mx-auto flex flex-col gap-6 animate-fadeIn">
      
      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-0">
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'all' ? 'bg-neon-green text-dark-900 shadow-[0_0_10px_rgba(4,211,97,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
          >
            Todos os Jogos
          </button>
          {loggedUser && (
            <>
              <button 
                onClick={() => setFilter('no_bet')}
                className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'no_bet' ? 'bg-yellow-400 text-dark-900 shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
              >
                Faltam Palpitar
              </button>
              <button 
                onClick={() => setFilter('already_betted')}
                className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'already_betted' ? 'bg-blue-400 text-dark-900 shadow-[0_0_10px_rgba(96,165,250,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
              >
                Já Palpitei
              </button>
            </>
          )}
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'pending' ? 'bg-orange-400 text-dark-900 shadow-[0_0_10px_rgba(251,146,60,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setFilter('finished')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-all ${filter === 'finished' ? 'bg-gray-300 text-dark-900 shadow-[0_0_10px_rgba(209,213,219,0.3)]' : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600'}`}
          >
            Encerrados
          </button>
        </div>

        <div className="flex items-center gap-3 bg-dark-800 px-4 py-1.5 rounded-full border border-dark-700">
          <span className="text-xs font-semibold text-gray-400">Data:</span>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Datas</option>
            {uniqueDates.map(date => (
              <option key={date} value={date} className="bg-dark-800">{date}</option>
            ))}
          </select>
        </div>
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
