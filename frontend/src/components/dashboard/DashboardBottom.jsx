import { useState } from 'react';
import { MatchRow } from './MatchRow';

export function DashboardBottom({
  nextWithoutBetAll, nextWithBetAll, handleOpenModal, setActiveTab, userBets,
  activeBolao, groups, activeGroup, setSelectedGroup, groupTable
}) {
  const [withoutBetIndex, setWithoutBetIndex] = useState(0);
  const [nextBetIndex, setNextBetIndex] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Jogos sem palpite */}
      {nextWithoutBetAll.length > 0 && (
        <div className="lg:col-span-4 bg-dark-800 border border-yellow-400/20 rounded-2xl p-4">
          {(() => {
            const nextTimeMs = new Date(nextWithoutBetAll[0].match_date).getTime();
            const simultaneous = nextWithoutBetAll.filter(m => new Date(m.match_date).getTime() === nextTimeMs);
            const isSimul = simultaneous.length > 1;
            const curIdx = withoutBetIndex >= simultaneous.length ? 0 : withoutBetIndex;
            const m = simultaneous[curIdx];
            if (!m) return null;
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-yellow-400 text-sm uppercase tracking-wider">⚠️ Ainda sem palpite!</h3>
                  {isSimul && (
                    <div className="flex items-center gap-1.5 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                      <button onClick={() => setWithoutBetIndex(prev => prev > 0 ? prev - 1 : simultaneous.length - 1)} className="text-yellow-500 hover:text-white transition-colors">◀</button>
                      <span className="text-[10px] text-yellow-500 font-bold">{curIdx + 1}/{simultaneous.length}</span>
                      <button onClick={() => setWithoutBetIndex(prev => prev < simultaneous.length - 1 ? prev + 1 : 0)} className="text-yellow-500 hover:text-white transition-colors">▶</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <MatchRow key={m.id} match={m} onClick={() => handleOpenModal(m)} />
                </div>
              </>
            );
          })()}
          <button onClick={() => setActiveTab('matches')} className="mt-3 w-full py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-bold hover:bg-yellow-400/20 transition-all">
            Palpitar agora ⚽
          </button>
        </div>
      )}

      {/* Jogos com palpite */}
      {nextWithBetAll.length > 0 && (
        <div className="lg:col-span-4 bg-dark-800 border border-neon-green/20 rounded-2xl p-4">
          {(() => {
            const nextTimeMs = new Date(nextWithBetAll[0].match_date).getTime();
            const simultaneous = nextWithBetAll.filter(m => new Date(m.match_date).getTime() === nextTimeMs);
            const isSimul = simultaneous.length > 1;
            const curIdx = nextBetIndex >= simultaneous.length ? 0 : nextBetIndex;
            const m = simultaneous[curIdx];
            if (!m) return null;
            return (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-neon-green text-sm uppercase tracking-wider">✅ Próximos palpites</h3>
                  {isSimul && (
                    <div className="flex items-center gap-1.5 bg-neon-green/10 px-2 py-0.5 rounded-lg border border-neon-green/20">
                      <button onClick={() => setNextBetIndex(prev => prev > 0 ? prev - 1 : simultaneous.length - 1)} className="text-neon-green hover:text-white transition-colors">◀</button>
                      <span className="text-[10px] text-neon-green font-bold">{curIdx + 1}/{simultaneous.length}</span>
                      <button onClick={() => setNextBetIndex(prev => prev < simultaneous.length - 1 ? prev + 1 : 0)} className="text-neon-green hover:text-white transition-colors">▶</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <MatchRow key={m.id} match={m} userBet={userBets.find(b => b.match === m.id)} showBet onClick={() => handleOpenModal(m)} />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Grupos (Oculto no Mata-Mata se for o caso) */}
      {(!activeBolao || activeBolao.scoring_mode !== 'KNOCKOUT') && (
        <div className={`${(nextWithoutBetAll.length > 0 && nextWithBetAll.length > 0) ? 'lg:col-span-4' : nextWithoutBetAll.length > 0 || nextWithBetAll.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} bg-dark-800 border border-dark-700 rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">🗂 Classificação</h3>
            {groups.length > 0 && (
              <select value={activeGroup} onChange={e => setSelectedGroup(e.target.value)}
                className="bg-dark-900 border border-dark-700 text-gray-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-neon-green">
                {groups.map(g => <option key={g} value={g}>Grupo {g}</option>)}
              </select>
            )}
          </div>
          {groupTable.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Nenhum dado.</p>
          ) : (
            <>
              <div className="grid grid-cols-10 text-[9px] font-bold text-gray-500 uppercase tracking-wider px-1 pb-1 border-b border-dark-700 mb-1">
                <span>#</span><span className="col-span-3">Equipe</span>
                <span className="text-center">J</span><span className="text-center">V</span>
                <span className="text-center">E</span><span className="text-center">D</span>
                <span className="text-center">SG</span><span className="text-center font-black">P</span>
              </div>
              {groupTable.map((t, i) => (
                <div key={t.name} className={`grid grid-cols-10 items-center px-1 py-1.5 rounded-lg mb-0.5 ${i < 2 ? 'bg-neon-green/5 border border-neon-green/10' : 'hover:bg-dark-700'}`}>
                  <span className={`text-xs font-black ${i < 2 ? 'text-neon-green' : 'text-gray-500'}`}>{i + 1}</span>
                  <div className="col-span-3 flex items-center gap-1">
                    {t.flag && <img src={t.flag} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />}
                    <span className="text-xs text-gray-300 truncate">{t.name}</span>
                  </div>
                  <span className="text-center text-xs text-gray-400">{t.J}</span>
                  <span className="text-center text-xs text-gray-400">{t.V}</span>
                  <span className="text-center text-xs text-gray-400">{t.E}</span>
                  <span className="text-center text-xs text-gray-400">{t.D}</span>
                  <span className={`text-center text-xs ${t.SG > 0 ? 'text-neon-green' : t.SG < 0 ? 'text-red-400' : 'text-gray-400'}`}>{t.SG > 0 ? `+${t.SG}` : t.SG}</span>
                  <span className="text-center text-xs font-black text-white">{t.PTS}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
