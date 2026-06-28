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
            {/* Pódio Visual (Top 3) */}
            {ranking.length > 0 && (
              <div className="flex items-end justify-center h-44 gap-2 mb-8 mt-4">
                {/* 2º Lugar */}
                {ranking[1] && (
                  <div className="flex flex-col items-center w-1/3 animate-[slideUp_0.5s_ease-out]">
                    <span className="text-sm font-bold text-gray-300 truncate w-full text-center px-1">{ranking[1].first_name || ranking[1].username}</span>
                    <span className="text-[10px] font-black text-white mb-1 flex items-center gap-1">
                      {ranking[1].total_points} pts
                      <span className="text-[12px]">
                          {ranking[1].trend === 'UP' && <span className="text-neon-green">↑</span>}
                          {ranking[1].trend === 'DOWN' && <span className="text-red-500">↓</span>}
                          {(!ranking[1].trend || ranking[1].trend === 'SAME') && <span className="text-dark-600">-</span>}
                      </span>
                    </span>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold" title="Cravadas">🎯 {ranking[1].cravadas || 0}</span>
                        <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20 font-bold" title="Acertos">✓ {ranking[1].acertos || 0}</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-dark-700 to-dark-600 rounded-t-xl h-20 border-t-2 border-gray-400 flex items-start justify-center pt-2">
                      <span className="text-2xl">🥈</span>
                    </div>
                  </div>
                )}
                {/* 1º Lugar */}
                {ranking[0] && (
                  <div className="flex flex-col items-center w-1/3 z-10 animate-[slideUp_0.7s_ease-out]">
                    <span className="text-2xl mb-1 animate-bounce">👑</span>
                    <span className="text-sm font-bold text-yellow-400 truncate w-full text-center px-1">{ranking[0].first_name || ranking[0].username}</span>
                    <span className="text-[10px] font-black text-white mb-1 flex items-center gap-1">
                      {ranking[0].total_points} pts
                      <span className="text-[12px]">
                          {ranking[0].trend === 'UP' && <span className="text-neon-green">↑</span>}
                          {ranking[0].trend === 'DOWN' && <span className="text-red-500">↓</span>}
                          {(!ranking[0].trend || ranking[0].trend === 'SAME') && <span className="text-dark-600">-</span>}
                      </span>
                    </span>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold" title="Cravadas">🎯 {ranking[0].cravadas || 0}</span>
                        <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20 font-bold" title="Acertos">✓ {ranking[0].acertos || 0}</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-yellow-500/20 to-yellow-500/40 rounded-t-xl h-28 border-t-2 border-yellow-400 flex items-start justify-center pt-2 shadow-[0_-5px_20px_rgba(250,204,21,0.2)]">
                      <span className="text-2xl">🥇</span>
                    </div>
                  </div>
                )}
                {/* 3º Lugar */}
                {ranking[2] && (
                  <div className="flex flex-col items-center w-1/3 animate-[slideUp_0.6s_ease-out]">
                    <span className="text-sm font-bold text-orange-400 truncate w-full text-center px-1">{ranking[2].first_name || ranking[2].username}</span>
                    <span className="text-[10px] font-black text-white mb-1 flex items-center gap-1">
                      {ranking[2].total_points} pts
                      <span className="text-[12px]">
                          {ranking[2].trend === 'UP' && <span className="text-neon-green">↑</span>}
                          {ranking[2].trend === 'DOWN' && <span className="text-red-500">↓</span>}
                          {(!ranking[2].trend || ranking[2].trend === 'SAME') && <span className="text-dark-600">-</span>}
                      </span>
                    </span>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-[8px] bg-yellow-400/10 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold" title="Cravadas">🎯 {ranking[2].cravadas || 0}</span>
                        <span className="text-[8px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20 font-bold" title="Acertos">✓ {ranking[2].acertos || 0}</span>
                    </div>
                    <div className="w-full bg-gradient-to-t from-orange-900/40 to-orange-800/40 rounded-t-xl h-16 border-t-2 border-orange-500 flex items-start justify-center pt-2">
                      <span className="text-2xl">🥉</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cabeçalho da Tabela */}
            <div className="flex items-center justify-between px-4 pb-4 mb-2 border-b border-dark-700 text-sm font-bold text-gray-400 uppercase tracking-wider">
              <span>Posição / Jogador</span>
              <span>Pontos</span>
            </div>

            {/* Lista de Usuários (Pula o Top 3 se o pódio estiver visível) */}
            {ranking.slice(ranking.length > 0 ? 3 : 0).map((user, idx) => {
              const index = ranking.length > 0 ? idx + 3 : idx;
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
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-xl ${positionStyle}`}>
                      {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : <span className="text-sm">{index + 1}º</span>}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-lg font-semibold ${isFirst ? 'text-white' : 'text-gray-300'}`}>
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] bg-yellow-400/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-400/20 font-bold" title="Placares Exatos (5 pontos)">🎯 {user.cravadas || 0} Cravadas</span>
                          <span className="text-[10px] bg-neon-green/10 text-neon-green px-2 py-0.5 rounded-full border border-neon-green/20 font-bold" title="Acertos de Vencedor/Empate (3 pontos)">✓ {user.acertos || 0} Acertos</span>
                          <span className="text-[12px] ml-2 font-black">
                              {user.trend === 'UP' && <span className="text-neon-green" title="Subiu no ranking">↑</span>}
                              {user.trend === 'DOWN' && <span className="text-red-500" title="Desceu no ranking">↓</span>}
                              {(!user.trend || user.trend === 'SAME') && <span className="text-dark-600" title="Manteve a posição">-</span>}
                          </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-neon-green">
                        {user.total_points}
                      </span>
                      <span className="text-sm font-medium text-gray-500">pts</span>
                    </div>
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
