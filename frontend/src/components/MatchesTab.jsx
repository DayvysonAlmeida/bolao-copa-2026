import { MatchCard } from './MatchCard';

export function MatchesTab({ matches, loggedUser, getUserBetForMatch, handleOpenModal, betChangeDeadlineLabel }) {
  const groupedMatches = matches.reduce((acc, match) => {
    const groupName = match.group ? `Grupo ${match.group}` : 'Fase Final';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(match);
    return acc;
  }, {});
  
  const sortedGroups = Object.keys(groupedMatches).sort();

  return (
    <main className="max-w-6xl mx-auto flex flex-col gap-10 animate-fadeIn">
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
