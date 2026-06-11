export function BetModal({ 
  selectedMatch, 
  setSelectedMatch, 
  handleSaveBet, 
  homeBet, 
  setHomeBet, 
  awayBet, 
  setHomeBetAway, 
  editingBetId, 
  isBeforeBetChangeDeadline, 
  betChangeDeadlineLabel, 
  statusMessage 
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button onClick={() => setSelectedMatch(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        <h3 className="text-center text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Registrar Palpite</h3>
        <div className="text-center text-sm text-gray-400 mb-4">
          Você pode alterar ou enviar o palpite até <span className="text-neon-green font-semibold">{betChangeDeadlineLabel}</span>.
        </div>
        <form onSubmit={handleSaveBet} className="mt-4">
          <div className="flex items-center justify-between gap-4 bg-dark-900 p-4 rounded-xl border border-dark-700">
            <div className="flex flex-col items-center w-1/3 text-center">
              <img src={selectedMatch.flag_home} alt={selectedMatch.home_team_name} className="w-12 h-8 rounded mb-1 object-cover shadow" />
              <span className="text-xs font-bold truncate w-full">{selectedMatch.home_team_name}</span>
              <input type="number" min="0" value={homeBet} onChange={(e) => setHomeBet(e.target.value)} className="w-16 h-12 bg-dark-800 border border-dark-700 text-center text-xl font-bold rounded-lg mt-3 focus:border-neon-green focus:outline-none text-white" />
            </div>
            <div className="text-xl font-bold text-gray-600">X</div>
            <div className="flex flex-col items-center w-1/3 text-center">
              <img src={selectedMatch.flag_away} alt={selectedMatch.away_team_name} className="w-12 h-8 rounded mb-1 object-cover shadow" />
              <span className="text-xs font-bold truncate w-full">{selectedMatch.away_team_name}</span>
              <input type="number" min="0" value={awayBet} onChange={(e) => setHomeBetAway(e.target.value)} className="w-16 h-12 bg-dark-800 border border-dark-700 text-center text-xl font-bold rounded-lg mt-3 focus:border-neon-green focus:outline-none text-white" />
            </div>
          </div>
          {editingBetId && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-950 text-yellow-300 border border-yellow-900 text-sm font-medium text-center">
              Já existe um palpite enviado para este jogo. Você pode alterar o palpite até <span className="font-semibold text-white">{betChangeDeadlineLabel}</span>.
            </div>
          )}
          {!editingBetId && isBeforeBetChangeDeadline && (
            <div className="mt-4 p-3 rounded-lg bg-blue-950 text-blue-300 border border-blue-900 text-sm font-medium text-center">
              Use o formulário para enviar seu palpite antes de {betChangeDeadlineLabel}.
            </div>
          )}
          {!isBeforeBetChangeDeadline && (
            <div className="mt-4 p-3 rounded-lg bg-red-950 text-red-300 border border-red-900 text-sm font-medium text-center">
              O prazo para enviar ou alterar palpites terminou em {betChangeDeadlineLabel}.
            </div>
          )}
          {statusMessage.text && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium ${statusMessage.type === 'success' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'}`}>{statusMessage.text}</div>
          )}
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setSelectedMatch(null)} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-3 rounded-xl transition-all">Cancelar</button>
            <button type="submit" disabled={!isBeforeBetChangeDeadline} className={`flex-1 ${isBeforeBetChangeDeadline ? 'bg-neon-green hover:bg-opacity-90 text-dark-900 shadow-lg shadow-neon-green/20' : 'bg-dark-700 text-gray-500 cursor-not-allowed'} font-bold py-3 rounded-xl transition-all`}>
              {editingBetId ? 'Alterar palpite' : 'Enviar palpite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
