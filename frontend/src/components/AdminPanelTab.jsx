import { useState, useEffect } from 'react';

export function AdminPanelTab({ matches, users, API_URL, accessToken, onSuccess }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Garante que users e matches sejam arrays antes de fazer o spread
  const safeUsers = Array.isArray(users) ? users : [];
  const safeMatches = Array.isArray(matches) ? matches : [];

  // Ordena usuários alfabeticamente para facilitar a busca no select
  const sortedUsers = [...safeUsers].sort((a, b) => {
    const nameA = (a?.first_name || a?.username || '').toLowerCase();
    const nameB = (b?.first_name || b?.username || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Filtra apenas jogos que ainda não começaram, ou mostra todos?
  // Admin pode lançar para qualquer jogo, mas vamos ordenar por data
  const sortedMatches = [...safeMatches].sort((a, b) => new Date(a?.match_date || 0) - new Date(b?.match_date || 0));

  const [allBets, setAllBets] = useState([]);

  // Busca todos os palpites do sistema uma única vez
  useEffect(() => {
    fetch(`${API_URL}/bets/`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        setAllBets(data);
      } else if (data && Array.isArray(data.results)) {
        setAllBets(data.results);
      } else {
        setAllBets([]);
      }
    })
    .catch(console.error);
  }, [API_URL, accessToken]);

  const userBets = allBets.filter(b => b.user === parseInt(selectedUserId));

  // Quando o Admin muda a partida, auto-preenche o placar se o usuário já tiver palpite
  const handleMatchChange = (e) => {
    const matchId = e.target.value;
    setSelectedMatchId(matchId);
    
    const existingBet = userBets.find(b => b.match === parseInt(matchId));
    if (existingBet) {
      setHomeScore(existingBet.home_score);
      setAwayScore(existingBet.away_score);
      setMessage({ text: 'Editando palpite existente deste usuário.', type: 'success' });
    } else {
      setHomeScore('');
      setAwayScore('');
      setMessage({ text: '', type: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedMatchId || homeScore === '' || awayScore === '') {
      setMessage({ text: 'Preencha todos os campos.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Verifica se já existe palpite para atualizar, ou cria um novo
      const existingBet = userBets.find(b => b.match === parseInt(selectedMatchId));
      const method = existingBet ? 'PUT' : 'POST';
      const endpoint = existingBet ? `${API_URL}/bets/${existingBet.id}/` : `${API_URL}/bets/`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          user: parseInt(selectedUserId),
          match: parseInt(selectedMatchId),
          home_score: parseInt(homeScore),
          away_score: parseInt(awayScore)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: `Palpite ${existingBet ? 'atualizado' : 'lançado'} com sucesso pelo Juiz!`, type: 'success' });
        
        // Atualiza a lista local de palpites para refletir a mudança instantaneamente
        if (existingBet) {
          setAllBets(allBets.map(b => b.id === data.id ? data : b));
        } else {
          setAllBets([...allBets, data]);
        }
        
        setHomeScore('');
        setAwayScore('');
        setSelectedMatchId('');
        if (onSuccess) onSuccess();
      } else {
        const errorMsg = data.non_field_errors?.[0] || data.detail || 'Erro ao lançar palpite.';
        setMessage({ text: errorMsg, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAPI = async () => {
    setIsSyncing(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await fetch(`${API_URL}/matches/sync_api/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: data.message || 'Sincronização concluída com sucesso!', type: 'success' });
        if (onSuccess) onSuccess(); // Recarrega os jogos
      } else {
        setMessage({ text: data.error || 'Erro ao sincronizar.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Erro de conexão na sincronização.', type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-dark-800 border border-yellow-500/30 rounded-3xl p-6 md:p-10 shadow-[0_0_30px_rgba(250,204,21,0.05)] relative overflow-hidden">
        
        {/* Efeito de brilho de fundo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
            <span className="text-2xl">⚖️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Área do Juiz</h2>
            <p className="text-gray-400 text-sm">Lance palpites em nome de outros usuários</p>
          </div>
          
          {/* Botão de Sincronização da API */}
          <div className="ml-auto">
            <button 
              onClick={handleSyncAPI}
              disabled={isSyncing}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <span className="animate-spin text-xl">⏳</span> Sincronizando...
                </>
              ) : (
                <>
                  <span className="text-xl">🔄</span> Sincronizar API
                </>
              )}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Seleção do Usuário */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Selecione o Usuário</label>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 text-white text-sm rounded-xl focus:ring-yellow-500 focus:border-yellow-500 block p-3"
              >
                <option value="">-- Escolha um usuário --</option>
                {sortedUsers.filter(u => u).map(u => (
                  <option key={u.id} value={u.id}>
                    {u?.first_name || u?.username} {u?.last_name ? ` ${u.last_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Seleção da Partida */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Selecione o Jogo</label>
              <select 
                value={selectedMatchId}
                onChange={handleMatchChange}
                className="w-full bg-dark-900 border border-dark-700 text-white text-sm rounded-xl focus:ring-yellow-500 focus:border-yellow-500 block p-3"
              >
                <option value="">-- Escolha um jogo --</option>
                
                {selectedUserId ? (
                  <>
                    <optgroup label="🔴 SEM PALPITE">
                      {sortedMatches.filter(m => m && !userBets.some(b => b.match === m.id)).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.home_team_name} x {m.away_team_name} ({new Date(m?.match_date || 0).toLocaleDateString('pt-BR')})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🟢 JÁ PALPITOU (Clique para editar)">
                      {sortedMatches.filter(m => m && userBets.some(b => b.match === m.id)).map(m => {
                        const bet = userBets.find(b => b.match === m.id);
                        return (
                          <option key={m.id} value={m.id}>
                            {m.home_team_name} x {m.away_team_name} (Placar: {bet?.home_score}x{bet?.away_score})
                          </option>
                        );
                      })}
                    </optgroup>
                  </>
                ) : (
                  <optgroup label="Selecione um usuário primeiro">
                    {sortedMatches.filter(m => m).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.home_team_name} x {m.away_team_name} ({new Date(m?.match_date || 0).toLocaleDateString('pt-BR')})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          <div className="p-6 bg-dark-900/50 rounded-2xl border border-dark-700">
            <label className="block text-center text-sm font-medium text-gray-400 mb-4">Placar do Palpite</label>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <input 
                  type="number" 
                  min="0"
                  max="20"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-20 h-20 text-center bg-dark-800 border border-dark-600 rounded-2xl text-3xl font-bold text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="block mt-2 text-sm text-gray-400">Time Casa</span>
              </div>
              <span className="text-2xl font-bold text-gray-600">X</span>
              <div className="text-center">
                <input 
                  type="number" 
                  min="0"
                  max="20"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-20 h-20 text-center bg-dark-800 border border-dark-600 rounded-2xl text-3xl font-bold text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  placeholder="0"
                />
                <span className="block mt-2 text-sm text-gray-400">Time Fora</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-400 text-dark-900 font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Lançando...' : 'Lançar Palpite Oficial'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
