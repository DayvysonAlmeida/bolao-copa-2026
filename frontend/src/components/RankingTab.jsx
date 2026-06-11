export function RankingTab({ ranking, loggedUser, userRankPosition }) {
  return (
    <main className="max-w-3xl mx-auto animate-fadeIn">
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-2 sm:p-6 shadow-2xl">
        
        {ranking.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nenhum jogador pontuou ainda.</p>
        ) : (
          <div className="flex flex-col">
            {loggedUser && userRankPosition >= 0 && (
              <div className="mb-4 rounded-3xl border border-neon-green/20 bg-neon-green/5 p-4 text-sm text-neon-green">
                Você está em <span className="font-semibold">{userRankPosition + 1}º</span> lugar com <span className="font-semibold">{ranking[userRankPosition].total_points}</span> pts.
              </div>
            )}
            {/* Cabeçalho da Tabela */}
            <div className="flex items-center justify-between px-4 pb-4 mb-2 border-b border-dark-700 text-sm font-bold text-gray-400 uppercase tracking-wider">
              <span>Posição / Jogador</span>
              <span>Pontos</span>
            </div>

            {/* Lista de Usuários */}
            {ranking.map((user, index) => {
              // Lógica visual para o pódio
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              
              let positionStyle = "text-gray-500 bg-dark-900";
              if (isFirst) positionStyle = "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]";
              if (isSecond) positionStyle = "text-gray-300 bg-gray-300/10 border border-gray-300/20";
              if (isThird) positionStyle = "text-orange-400 bg-orange-400/10 border border-orange-400/20";

              return (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-4 mb-2 rounded-xl transition-colors hover:bg-dark-700 ${isFirst ? 'bg-dark-700/50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black ${positionStyle}`}>
                      {index + 1}º
                    </div>
                    <span className={`text-lg font-semibold ${isFirst ? 'text-white' : 'text-gray-300'}`}>
                      {user.username}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-neon-green">
                      {user.total_points}
                    </span>
                    <span className="text-sm font-medium text-gray-500">pts</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  );
}
