import React from 'react';
import { formatTeamName } from '../utils';

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
  
  const hasRealScore = match.status !== 'PENDING' && match.home_score !== null;
  const displayHome = hasRealScore ? match.home_score : (bet ? bet.home_score : '-');
  const displayAway = hasRealScore ? match.away_score : (bet ? bet.away_score : '-');
  const displayPenHome = hasRealScore ? match.home_penalty_score : null;
  const displayPenAway = hasRealScore ? match.away_penalty_score : null;
  const showBetColor = match.status === 'PENDING' && bet;

  const renderScore = (score, pen) => {
    if (score === null || score === '-') return '-';
    if (pen !== null && pen !== undefined) {
      return (
        <div className="flex items-center gap-1 justify-end">
          <span>{score}</span>
          <span className="text-[8px] text-yellow-500 font-normal">({pen})</span>
        </div>
      );
    }
    return score;
  };

  const formattedDate = new Date(match.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const formattedTime = new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      onClick={() => handleOpenModal(match)}
      className="w-40 h-24 bg-dark-800 border border-dark-700 rounded-lg overflow-hidden cursor-pointer hover:border-neon-green hover:shadow-[0_0_10px_rgba(4,211,97,0.3)] transition-all flex flex-col relative z-20"
    >
      <div className="bg-dark-900 border-b border-dark-700 text-center py-0.5 text-[9px] text-gray-400 font-mono tracking-wider h-5 flex items-center justify-center">
        {formattedDate} • {formattedTime}
      </div>
      <div className="flex flex-col text-sm flex-1">
        {/* Time da Casa */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-dark-700 flex-1">
          <div className="flex items-center gap-2 truncate">
            {match.flag_home ? (
              <img src={match.flag_home} alt={match.home_team_name} className="w-4 h-4 object-cover rounded-full border border-dark-600" />
            ) : (
              <div className="w-4 h-4 bg-dark-700 rounded-full border border-dark-600 flex items-center justify-center text-[8px]">?</div>
            )}
            <span className="truncate font-semibold text-gray-200 text-xs">{formatTeamName(match.home_team_name)}</span>
          </div>
          <div className={`font-bold text-xs ${showBetColor ? 'text-neon-green' : 'text-white'}`}>
            {renderScore(displayHome, displayPenHome)}
          </div>
        </div>
        
        {/* Time Visitante */}
        <div className="flex items-center justify-between px-2 py-1 bg-dark-800/80 flex-1">
          <div className="flex items-center gap-2 truncate">
            {match.flag_away ? (
              <img src={match.flag_away} alt={match.away_team_name} className="w-4 h-4 object-cover rounded-full border border-dark-600" />
            ) : (
              <div className="w-4 h-4 bg-dark-700 rounded-full border border-dark-600 flex items-center justify-center text-[8px]">?</div>
            )}
            <span className="truncate font-semibold text-gray-200 text-xs">{formatTeamName(match.away_team_name)}</span>
          </div>
          <div className={`font-bold text-xs ${showBetColor ? 'text-neon-green' : 'text-white'}`}>
            {renderScore(displayAway, displayPenAway)}
          </div>
        </div>
      </div>
      
      {/* Área de Pênaltis e Status do Palpite */}
      <div className="h-5 bg-dark-900 border-t border-dark-700 flex items-center justify-center text-[9px] font-medium text-gray-400">
        {match.status === 'FINISHED' || match.status === 'IN_PROGRESS' ? (
           bet ? (
              <span className="text-neon-green">Palpite: {bet.home_score} x {bet.away_score}</span>
           ) : (
              <span className="text-gray-500">{match.status === 'FINISHED' ? 'Encerrado' : <span className="text-red-500 animate-pulse">🔴 Ao Vivo</span>}</span>
           )
        ) : (
           bet ? (
             <span className="text-neon-green/80">Palpite: {bet.home_score} x {bet.away_score}</span>
           ) : (
             <span className="text-blue-400">Faça seu palpite</span>
           )
        )}
      </div>
    </div>
  );
};


export const BracketTab = ({ matches, loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel }) => {
  // Busca segura do jogo pelo número oficial da FIFA
  const getMatchByNumber = (num) => matches.find(m => m.match_number === num) || null;

  // LADO ESQUERDO
  const r32Left = [74, 77, 73, 75, 83, 84, 81, 82].map(getMatchByNumber);
  const r16Left = [89, 90, 93, 94].map(getMatchByNumber);
  const qfLeft = [97, 98].map(getMatchByNumber);
  const sfLeft = [101].map(getMatchByNumber);

  // LADO DIREITO
  const r32Right = [76, 78, 79, 80, 86, 88, 85, 87].map(getMatchByNumber);
  const r16Right = [91, 92, 95, 96].map(getMatchByNumber);
  const qfRight = [99, 100].map(getMatchByNumber);
  const sfRight = [102].map(getMatchByNumber);

  // FINAIS
  const finals = [104].map(getMatchByNumber);
  const thirdPlaceMatches = matches.filter(m => m.match_number === 103);

  const sharedProps = { loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel };

  return (
    <div className="w-full overflow-x-auto pb-12 bracket-container">
      <div className="flex justify-between p-4 gap-8 mx-auto mt-8" style={{ width: 'max-content', minHeight: '1000px' }}>
        
        {/* LADO ESQUERDO */}
        <div className="flex gap-8">
          {/* 16-AVOS (Esquerda) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">16-avos</h3>
            {r32Left.map((match, idx) => (
              <div key={`r32l-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  <BracketMatchCard match={match} {...sharedProps} />
                </div>
                {/* Bracket Right Connector `]` */}
                {idx % 2 === 0 && (
                  <div className="absolute right-[-1rem] w-[1rem] border-r-2 border-t-2 border-b-2 border-dark-600 top-1/2 h-full z-10 rounded-r-xl"></div>
                )}
              </div>
            ))}
          </div>

          {/* OITAVAS (Esquerda) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">Oitavas</h3>
            {r16Left.map((match, idx) => (
              <div key={`r16l-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  {/* Connector line Left */}
                  <div className="absolute left-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                  <BracketMatchCard match={match} {...sharedProps} />
                </div>
                {/* Bracket Right Connector `]` */}
                {idx % 2 === 0 && (
                  <div className="absolute right-[-1rem] w-[1rem] border-r-2 border-t-2 border-b-2 border-dark-600 top-1/2 h-full z-10 rounded-r-xl"></div>
                )}
              </div>
            ))}
          </div>

          {/* QUARTAS (Esquerda) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">Quartas</h3>
            {qfLeft.map((match, idx) => (
              <div key={`qfl-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  {/* Connector line Left */}
                  <div className="absolute left-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                  <BracketMatchCard match={match} {...sharedProps} />
                </div>
                {/* Bracket Right Connector `]` */}
                {idx % 2 === 0 && (
                  <div className="absolute right-[-1rem] w-[1rem] border-r-2 border-t-2 border-b-2 border-dark-600 top-1/2 h-full z-10 rounded-r-xl"></div>
                )}
              </div>
            ))}
          </div>

          {/* SEMIFINAL (Esquerda) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">Semifinal</h3>
            {sfLeft.map((match, idx) => (
              <div key={`sfl-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  {/* Connector line Left */}
                  <div className="absolute left-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                  <BracketMatchCard match={match} {...sharedProps} />
                  {/* Connector line Right to Final */}
                  <div className="absolute right-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTRO (FINAL E 3º LUGAR) */}
        <div className="flex flex-col px-4 relative w-56">
          <div className="absolute inset-0 flex flex-col justify-center items-center w-full z-20">
            {finals.map((match, idx) => (
              <div key={`fin-${idx}`} className="relative flex items-center scale-110 shadow-[0_0_30px_rgba(250,204,21,0.2)] rounded-lg z-20">
                <h3 className="text-center text-yellow-400 font-bold text-sm absolute bottom-full mb-4 w-full flex items-center justify-center gap-2 whitespace-nowrap left-1/2 -translate-x-1/2">🏆 Grande Final 🏆</h3>
                {/* Connector lines from both sides */}
                <div className="absolute left-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                <div className="absolute right-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                <BracketMatchCard match={match} {...sharedProps} />
              </div>
            ))}
          </div>
          
          {/* TERCEIRO LUGAR */}
          {thirdPlaceMatches.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center w-full opacity-90">
              <h3 className="text-center text-gray-400 font-bold text-[11px] mb-4 whitespace-nowrap">Disputa do 3º Lugar</h3>
              <div className="flex flex-col justify-center">
                {thirdPlaceMatches.map((match, idx) => (
                  <div key={`3rd-${idx}`} className="flex items-center scale-90 opacity-80 hover:opacity-100 transition-all z-20 relative">
                    <BracketMatchCard match={match} {...sharedProps} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LADO DIREITO */}
        <div className="flex gap-12">
          {/* SEMIFINAL (Direita) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">Semifinal</h3>
            {sfRight.map((match, idx) => (
              <div key={`sfr-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  {/* Connector line Left (to final) */}
                  <div className="absolute left-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                  <BracketMatchCard match={match} {...sharedProps} />
                  {/* Connector line Right */}
                  <div className="absolute right-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                </div>
              </div>
            ))}
          </div>

          {/* QUARTAS (Direita) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">Quartas</h3>
            {qfRight.map((match, idx) => (
              <div key={`qfr-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  <BracketMatchCard match={match} {...sharedProps} />
                  {/* Connector line Right */}
                  <div className="absolute right-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                </div>
                {/* Bracket Left Connector `[` */}
                {idx % 2 === 0 && (
                  <div className="absolute left-[-1rem] w-[1rem] border-l-2 border-t-2 border-b-2 border-dark-600 top-1/2 h-full z-10 rounded-l-xl"></div>
                )}
              </div>
            ))}
          </div>

          {/* OITAVAS (Direita) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">Oitavas</h3>
            {r16Right.map((match, idx) => (
              <div key={`r16r-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  <BracketMatchCard match={match} {...sharedProps} />
                  {/* Connector line Right */}
                  <div className="absolute right-[-1rem] w-[1rem] border-b-2 border-dark-600 top-1/2"></div>
                </div>
                {/* Bracket Left Connector `[` */}
                {idx % 2 === 0 && (
                  <div className="absolute left-[-1rem] w-[1rem] border-l-2 border-t-2 border-b-2 border-dark-600 top-1/2 h-full z-10 rounded-l-xl"></div>
                )}
              </div>
            ))}
          </div>

          {/* 16-AVOS (Direita) */}
          <div className="flex flex-col h-full w-40 relative">
            <h3 className="text-center text-neon-green font-bold text-sm absolute -top-8 w-full">16-avos</h3>
            {r32Right.map((match, idx) => (
              <div key={`r32r-${idx}`} className="flex-1 relative flex flex-col justify-center">
                <div className="relative z-20">
                  <BracketMatchCard match={match} {...sharedProps} />
                </div>
                {/* Bracket Left Connector `[` */}
                {idx % 2 === 0 && (
                  <div className="absolute left-[-1rem] w-[1rem] border-l-2 border-t-2 border-b-2 border-dark-600 top-1/2 h-full z-10 rounded-l-xl"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
