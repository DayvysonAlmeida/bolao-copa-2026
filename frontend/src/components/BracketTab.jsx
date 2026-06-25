import React from 'react';

// Helper component for a single match in the bracket
const BracketMatchCard = ({ match, loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel }) => {
  if (!match) {
    return (
      <div className="w-48 h-24 bg-dark-800/50 border border-dark-700 rounded-lg flex items-center justify-center text-xs text-gray-500">
        A Definir
      </div>
    );
  }

  const bet = getUserBetForMatch(match.id);
  const isMatchLocked = match.status !== 'PENDING';
  
  // Placar a ser exibido: da API se o jogo estiver rolando/finalizado, senão do palpite
  const showBetInsteadOfScore = match.status === 'PENDING' && bet;
  
  const scoreHome = showBetInsteadOfScore ? bet.home_score : match.home_score;
  const scoreAway = showBetInsteadOfScore ? bet.away_score : match.away_score;
  
  const hasPenalties = match.home_score === match.away_score && match.home_score !== null && match.status !== 'PENDING';
  const betHasPenalties = bet && bet.home_score === bet.away_score && bet.home_score !== null;

  return (
    <div 
      onClick={() => handleOpenModal(match)}
      className="w-48 bg-dark-800 border border-dark-700 rounded-lg overflow-hidden cursor-pointer hover:border-neon-green hover:shadow-[0_0_10px_rgba(4,211,97,0.3)] transition-all flex flex-col relative z-10"
    >
      <div className="flex flex-col text-sm">
        {/* Time da Casa */}
        <div className="flex items-center justify-between p-2 border-b border-dark-700">
          <div className="flex items-center gap-2 truncate">
            {match.flag_home ? (
              <img src={match.flag_home} alt={match.home_team_name} className="w-5 h-5 object-cover rounded-full border border-dark-600" />
            ) : (
              <div className="w-5 h-5 bg-dark-700 rounded-full border border-dark-600 flex items-center justify-center text-[8px]">?</div>
            )}
            <span className="truncate font-semibold text-gray-200">{match.home_team_name || 'A Definir'}</span>
          </div>
          <div className={`font-bold w-6 text-center ${showBetInsteadOfScore ? 'text-neon-green' : 'text-white'}`}>
            {scoreHome !== null ? scoreHome : '-'}
          </div>
        </div>
        
        {/* Time Visitante */}
        <div className="flex items-center justify-between p-2 bg-dark-800/80">
          <div className="flex items-center gap-2 truncate">
            {match.flag_away ? (
              <img src={match.flag_away} alt={match.away_team_name} className="w-5 h-5 object-cover rounded-full border border-dark-600" />
            ) : (
              <div className="w-5 h-5 bg-dark-700 rounded-full border border-dark-600 flex items-center justify-center text-[8px]">?</div>
            )}
            <span className="truncate font-semibold text-gray-200">{match.away_team_name || 'A Definir'}</span>
          </div>
          <div className={`font-bold w-6 text-center ${showBetInsteadOfScore ? 'text-neon-green' : 'text-white'}`}>
            {scoreAway !== null ? scoreAway : '-'}
          </div>
        </div>
      </div>
      
      {/* Área de Pênaltis e Status do Palpite */}
      <div className="h-6 bg-dark-900 border-t border-dark-700 flex items-center justify-center text-[10px] font-medium text-gray-400">
        {match.status === 'FINISHED' ? (
           hasPenalties ? (
             <span className="text-yellow-500">Pênaltis: {match.penalty_winner_name} venceu</span>
           ) : <span className="text-gray-500">Encerrado</span>
        ) : match.status === 'IN_PROGRESS' ? (
           <span className="text-neon-green animate-pulse">🔴 Ao Vivo</span>
        ) : (
           bet ? (
             betHasPenalties && bet.penalty_winner_name ? (
               <span className="text-yellow-500">Seu palpite (Pênaltis: {bet.penalty_winner_name})</span>
             ) : (
               <span className="text-neon-green/80">Palpite salvo</span>
             )
           ) : (
             <span className="text-blue-400">Faça seu palpite</span>
           )
        )}
      </div>
    </div>
  );
};


export const BracketTab = ({ matches, loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel }) => {
  // Agrupar jogos pelas fases do Mata-Mata (Suporta o formato antigo e o da nova API)
  const groupedMatches = {
    'ROUND_16': matches.filter(m => m.phase === 'R16' || m.phase === 'ROUND_16'),
    'QUARTER_FINALS': matches.filter(m => m.phase === 'QF' || m.phase === 'QUARTER_FINALS'),
    'SEMI_FINALS': matches.filter(m => m.phase === 'SF' || m.phase === 'SEMI_FINALS'),
    'FINAL': matches.filter(m => m.phase === 'FINAL' || m.phase === 'TEST_FINAL')
  };
  
  const thirdPlaceMatches = matches.filter(m => m.phase === '3RD' || m.phase === 'THIRD_PLACE');

  // Padding helper to ensure we render enough slots for the bracket structure
  // Round of 16 usually has 8 matches, Quarters 4, Semis 2, Final 1
  const getMatchesWithPadding = (phaseMatches, expectedCount) => {
    const list = [...phaseMatches];
    while(list.length < expectedCount) {
      list.push(null);
    }
    return list;
  };

  const roundOf16 = getMatchesWithPadding(groupedMatches['ROUND_16'] || [], 8);
  const quarters = getMatchesWithPadding(groupedMatches['QUARTER_FINALS'] || [], 4);
  const semis = getMatchesWithPadding(groupedMatches['SEMI_FINALS'] || [], 2);
  const finals = getMatchesWithPadding(groupedMatches['FINAL'] || [], 1);

  return (
    <div className="w-full overflow-x-auto pb-12 bracket-container">
      <div className="flex min-w-[1000px] justify-between p-4 gap-8 mx-auto" style={{ width: 'max-content' }}>
        
        {/* OITAVAS DE FINAL */}
        <div className="flex flex-col gap-4">
          <h3 className="text-center text-neon-green font-bold text-sm mb-4">Oitavas de Final</h3>
          <div className="flex flex-col gap-6">
            {roundOf16.map((match, idx) => (
              <div key={idx} className="relative flex items-center bracket-node">
                <BracketMatchCard 
                  match={match} 
                  loggedUser={loggedUser} 
                  getUserBetForMatch={getUserBetForMatch} 
                  handleOpenModal={handleOpenModal} 
                  betChangeDeadlineLabel={betChangeDeadlineLabel}
                />
                {/* Connector line Right */}
                <div className="absolute right-[-2rem] w-[2rem] border-b-2 border-dark-600 top-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* QUARTAS DE FINAL */}
        <div className="flex flex-col justify-around">
          <h3 className="text-center text-neon-green font-bold text-sm mb-4">Quartas de Final</h3>
          <div className="flex flex-col justify-around h-full py-10">
            {quarters.map((match, idx) => (
              <div key={idx} className="relative flex items-center bracket-node">
                {/* Connector line Left */}
                <div className="absolute left-[-2rem] w-[2rem] border-b-2 border-dark-600 top-1/2"></div>
                <BracketMatchCard 
                  match={match} 
                  loggedUser={loggedUser} 
                  getUserBetForMatch={getUserBetForMatch} 
                  handleOpenModal={handleOpenModal} 
                  betChangeDeadlineLabel={betChangeDeadlineLabel}
                />
                {/* Connector line Right */}
                <div className="absolute right-[-2rem] w-[2rem] border-b-2 border-dark-600 top-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* SEMIFINAIS */}
        <div className="flex flex-col justify-around">
          <h3 className="text-center text-neon-green font-bold text-sm mb-4">Semifinais</h3>
          <div className="flex flex-col justify-around h-full py-32">
            {semis.map((match, idx) => (
              <div key={idx} className="relative flex items-center bracket-node">
                {/* Connector line Left */}
                <div className="absolute left-[-2rem] w-[2rem] border-b-2 border-dark-600 top-1/2"></div>
                <BracketMatchCard 
                  match={match} 
                  loggedUser={loggedUser} 
                  getUserBetForMatch={getUserBetForMatch} 
                  handleOpenModal={handleOpenModal} 
                  betChangeDeadlineLabel={betChangeDeadlineLabel}
                />
                {/* Connector line Right */}
                <div className="absolute right-[-2rem] w-[2rem] border-b-2 border-dark-600 top-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL */}
        <div className="flex flex-col justify-center gap-10">
          <div>
            <h3 className="text-center text-yellow-400 font-bold text-sm mb-4 flex items-center justify-center gap-2">🏆 Grande Final 🏆</h3>
            <div className="flex flex-col justify-center">
              {finals.map((match, idx) => (
                <div key={idx} className="relative flex items-center scale-110 shadow-[0_0_30px_rgba(250,204,21,0.2)] rounded-lg">
                  {/* Connector line Left */}
                  <div className="absolute left-[-2rem] w-[2rem] border-b-2 border-dark-600 top-1/2"></div>
                  <BracketMatchCard 
                    match={match} 
                    loggedUser={loggedUser} 
                    getUserBetForMatch={getUserBetForMatch} 
                    handleOpenModal={handleOpenModal} 
                    betChangeDeadlineLabel={betChangeDeadlineLabel}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* TERCEIRO LUGAR */}
          {thirdPlaceMatches.length > 0 && (
            <div className="mt-8 opacity-90">
              <h3 className="text-center text-gray-400 font-bold text-[11px] mb-2">Disputa do 3º Lugar</h3>
              <div className="flex flex-col justify-center">
                {thirdPlaceMatches.map((match, idx) => (
                  <div key={idx} className="flex items-center scale-90 opacity-80 hover:opacity-100 transition-all">
                    <BracketMatchCard 
                      match={match} 
                      loggedUser={loggedUser} 
                      getUserBetForMatch={getUserBetForMatch} 
                      handleOpenModal={handleOpenModal} 
                      betChangeDeadlineLabel={betChangeDeadlineLabel}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
