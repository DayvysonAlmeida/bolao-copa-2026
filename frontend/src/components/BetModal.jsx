import { useState, useEffect } from 'react';
import { formatTeamName } from '../utils';

export function BetModal({ 
  selectedMatch, 
  setSelectedMatch, 
  handleSaveBet, 
  homeBet, 
  setHomeBet, 
  awayBet, 
  setHomeBetAway,
  penaltyWinner,
  setPenaltyWinner,
  editingBetId, 
  isBeforeBetChangeDeadline, 
  betChangeDeadlineLabel, 
  statusMessage,
  activeBolao
}) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (selectedMatch && selectedMatch.id) {
      setLoadingComments(true);
      fetch(`${API_URL}/comments/?match=${selectedMatch.id}`)
        .then(res => res.json())
        .then(data => {
          setComments(Array.isArray(data) ? data : data.results || []);
          setLoadingComments(false);
        })
        .catch(err => {
          console.error("Erro ao carregar comentários", err);
          setLoadingComments(false);
        });
    }
  }, [selectedMatch, API_URL]);

  const handlePostComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/comments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ match: selectedMatch.id, text: newComment })
    })
    .then(res => res.json())
    .then(data => {
      setComments([data, ...comments]);
      setNewComment("");
    })
    .catch(err => console.error("Erro ao postar comentário", err));
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button onClick={() => setSelectedMatch(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        <h3 className="text-center text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Registrar Palpite</h3>
        <div className="text-center text-sm text-gray-400 mb-4">
          Você pode alterar ou enviar o palpite até <span className="text-neon-green font-semibold">{betChangeDeadlineLabel}</span>.
        </div>
        
        {(!selectedMatch.home_team_name || !selectedMatch.away_team_name) && (
          <div className="mt-2 mb-4 p-3 rounded-lg bg-orange-950 text-orange-300 border border-orange-900 text-sm font-medium text-center shadow-lg">
            ⚠️ Aguarde a definição das duas equipes para poder enviar ou alterar seu palpite para este jogo.
          </div>
        )}
        <form onSubmit={handleSaveBet} className="mt-4">
          <div className="flex items-center justify-between gap-4 bg-dark-900 p-4 rounded-xl border border-dark-700">
            <div className="flex flex-col items-center w-1/3 text-center">
              {selectedMatch.flag_home ? <img src={selectedMatch.flag_home} alt={selectedMatch.home_team_name} className="w-12 h-8 rounded mb-1 object-cover shadow" /> : <div className="w-12 h-8 bg-dark-700 rounded flex items-center justify-center text-xs mb-1 border border-dark-600">?</div>}
              <span className="text-xs font-bold truncate w-full">{formatTeamName(selectedMatch.home_team_name)}</span>
              <input type="number" min="0" value={homeBet} onChange={(e) => setHomeBet(e.target.value)} disabled={!selectedMatch.home_team_name || !selectedMatch.away_team_name} className="w-16 h-12 bg-dark-800 border border-dark-700 text-center text-xl font-bold rounded-lg mt-3 focus:border-neon-green focus:outline-none text-white disabled:opacity-50" />
            </div>
            <div className="text-xl font-bold text-gray-600">X</div>
            <div className="flex flex-col items-center w-1/3 text-center">
              {selectedMatch.flag_away ? <img src={selectedMatch.flag_away} alt={selectedMatch.away_team_name} className="w-12 h-8 rounded mb-1 object-cover shadow" /> : <div className="w-12 h-8 bg-dark-700 rounded flex items-center justify-center text-xs mb-1 border border-dark-600">?</div>}
              <span className="text-xs font-bold truncate w-full">{formatTeamName(selectedMatch.away_team_name)}</span>
              <input type="number" min="0" value={awayBet} onChange={(e) => setHomeBetAway(e.target.value)} disabled={!selectedMatch.home_team_name || !selectedMatch.away_team_name} className="w-16 h-12 bg-dark-800 border border-dark-700 text-center text-xl font-bold rounded-lg mt-3 focus:border-neon-green focus:outline-none text-white disabled:opacity-50" />
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
            <button type="submit" disabled={!isBeforeBetChangeDeadline || !selectedMatch.home_team_name || !selectedMatch.away_team_name} className={`flex-1 ${isBeforeBetChangeDeadline && selectedMatch.home_team_name && selectedMatch.away_team_name ? 'bg-neon-green hover:bg-opacity-90 text-dark-900 shadow-lg shadow-neon-green/20' : 'bg-dark-700 text-gray-500 cursor-not-allowed'} font-bold py-3 rounded-xl transition-all`}>
              {editingBetId ? 'Alterar palpite' : 'Enviar palpite'}
            </button>
          </div>
        </form>

        {/* RESENHA SECTION */}
        <div className="mt-8 border-t border-dark-700 pt-6">
          <h3 className="text-neon-green font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
            💬 Resenha do Jogo
          </h3>
          <div className="bg-dark-900 border border-dark-700 rounded-xl p-4 h-48 overflow-y-auto mb-4 flex flex-col gap-3">
            {loadingComments ? (
              <div className="text-gray-500 text-xs text-center my-auto">Carregando resenha...</div>
            ) : comments.length === 0 ? (
              <div className="text-gray-500 text-xs text-center my-auto">Nenhum comentário ainda. Seja o primeiro a zoar!</div>
            ) : (
              comments.map(c => {
                const getDisplayName = (c) => {
                  if (c.first_name) return `${c.first_name} ${c.last_name || ''}`.trim();
                  return c.username;
                };
                const getUserColor = (userId) => {
                  const colors = [
                    'text-blue-400', 'text-pink-400', 'text-yellow-400', 
                    'text-purple-400', 'text-orange-400', 'text-cyan-400', 
                    'text-teal-400', 'text-rose-400'
                  ];
                  if (!userId) return colors[0];
                  return colors[userId % colors.length];
                };
                return (
                  <div key={c.id} className="bg-dark-800 p-3 rounded-lg border border-dark-700">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${getUserColor(c.user)}`}>{getDisplayName(c)}</span>
                      <span className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-gray-300">{c.text}</p>
                  </div>
                );
              })
            )}
          </div>
          
          {localStorage.getItem('token') ? (
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input 
                type="text" 
                value={newComment} 
                onChange={e => setNewComment(e.target.value)} 
                placeholder="Mande sua resenha..." 
                className="flex-1 bg-dark-800 border border-dark-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-green"
              />
              <button type="submit" disabled={!newComment.trim()} className="bg-neon-green text-dark-900 px-4 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-opacity-90">
                Enviar
              </button>
            </form>
          ) : (
            <div className="text-xs text-gray-500 text-center">Faça login para participar da resenha.</div>
          )}
        </div>

      </div>
    </div>
  );
}
