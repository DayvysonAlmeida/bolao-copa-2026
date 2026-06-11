export function MyBetsTab({ userBets, matches, loggedUser, handleOpenModal, setShowRegisterModal, setShowLoginModal, betChangeDeadlineLabel }) {
  return (
    <main className="max-w-5xl mx-auto animate-fadeIn">
      <div className="bg-dark-800 rounded-3xl border border-dark-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Meus palpites</h2>
            <p className="text-sm text-gray-400">Jogos nos quais você já enviou um palpite.</p>
          </div>
          {!loggedUser && (
            <div className="flex gap-2">
              <button onClick={() => setShowRegisterModal(true)} className="rounded-full bg-dark-700 border border-dark-600 px-4 py-2 text-white font-semibold hover:bg-dark-600 transition-all hidden sm:block">Criar Conta</button>
              <button onClick={() => setShowLoginModal(true)} className="rounded-full bg-neon-green px-4 py-2 text-dark-900 font-semibold hover:bg-opacity-90 transition-all">Login</button>
            </div>
          )}
        </div>

        {!loggedUser ? (
          <div className="text-center text-gray-400 py-20">Faça login para ver seus palpites.</div>
        ) : userBets.length === 0 ? (
          <div className="text-center text-gray-400 py-20">Você ainda não registrou nenhum palpite.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBets.map(bet => {
              const match = matches.find(item => item.id === bet.match)
              if (!match) return null

              const dateObj = new Date(match.match_date)
              const dayMonth = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              
              let resultBorderClass = 'border-dark-700';
              let resultShadowClass = '';
              
              if (match.status === 'FINISHED') {
                if (bet.points_earned === 5) {
                  resultBorderClass = 'border-yellow-400/80';
                  resultShadowClass = 'shadow-[0_0_20px_rgba(250,204,21,0.5)]';
                } else if (bet.points_earned === 3) {
                  resultBorderClass = 'border-neon-green/95';
                  resultShadowClass = 'shadow-[0_0_25px_rgba(4,211,97,0.7)]';
                } else if (bet.points_earned < 3) {
                  resultBorderClass = 'border-red-400/80';
                  resultShadowClass = 'shadow-[0_0_20px_rgba(248,113,113,0.5)]';
                }
              }

              return (
                <div key={bet.id} onClick={() => handleOpenModal(match)} className={`relative bg-dark-900 rounded-3xl border p-5 shadow-lg cursor-pointer transition-all ${resultBorderClass} ${resultShadowClass} ${match.status === 'FINISHED' ? 'opacity-60 cursor-not-allowed' : 'hover:border-neon-green'}`}>
                  {match.status === 'FINISHED' && (
                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 rounded-full text-xs font-bold px-3 py-1 border ${
                      bet.points_earned === 5 
                        ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50' 
                        : bet.points_earned === 3
                          ? 'bg-neon-green/20 text-neon-green border-neon-green/50'
                          : 'bg-red-400/20 text-red-300 border-red-400/50'
                    }`}>
                      {bet.points_earned === 5 ? '🎯 Exato!' : bet.points_earned === 3 ? '✓ Acertou!' : '✗ Errou'} ({bet.points_earned} pts)
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-500">{match.group ? `Grupo ${match.group}` : 'Fase Final'}</span>
                    <span className="text-xs text-gray-400">{match.status === 'FINISHED' ? 'Encerrado' : `${dayMonth} às ${time}`}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={match.flag_home} alt={match.home_team_name} className="w-10 h-6 rounded-sm object-cover" />
                      <span className="text-sm text-gray-300">{match.home_team_name}</span>
                    </div>
                    <div className="text-3xl font-black text-white">{bet.home_score} x {bet.away_score}</div>
                    <div className="flex items-center gap-3">
                      <img src={match.flag_away} alt={match.away_team_name} className="w-10 h-6 rounded-sm object-cover" />
                      <span className="text-sm text-gray-300">{match.away_team_name}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                    <span className="rounded-full bg-dark-900 border border-dark-700 px-3 py-1">Prazo: {betChangeDeadlineLabel}</span>
                    <span className="rounded-full bg-neon-green/10 text-neon-green px-3 py-1">Clique para editar</span>
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
