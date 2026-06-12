import { useState } from 'react';

export function AdminPanelTab({ matches, users, API_URL, accessToken, onSuccess }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Ordena usuários alfabeticamente para facilitar a busca no select
  const sortedUsers = [...(users || [])].sort((a, b) => {
    const nameA = (a.first_name || a.username).toLowerCase();
    const nameB = (b.first_name || b.username).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Filtra apenas jogos que ainda não começaram, ou mostra todos?
  // Admin pode lançar para qualquer jogo, mas vamos ordenar por data
  const sortedMatches = [...(matches || [])].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedMatchId || homeScore === '' || awayScore === '') {
      setMessage({ text: 'Preencha todos os campos.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch(`${API_URL}/bets/`, {
        method: 'POST',
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
        setMessage({ text: 'Palpite lançado com sucesso pelo Juiz!', type: 'success' });
        setHomeScore('');
        setAwayScore('');
        if (onSuccess) onSuccess();
      } else {
        // Se a API retornar erro (ex: erro de validação ou restrição customizada)
        const errorMsg = data.non_field_errors?.[0] || data.detail || 'Erro ao lançar palpite. Verifique se o usuário já tem palpite para este jogo.';
        setMessage({ text: errorMsg, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setIsLoading(false);
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
                {sortedUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name || u.username} {u.last_name ? ` ${u.last_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Seleção da Partida */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Selecione o Jogo</label>
              <select 
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 text-white text-sm rounded-xl focus:ring-yellow-500 focus:border-yellow-500 block p-3"
              >
                <option value="">-- Escolha um jogo --</option>
                {sortedMatches.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.home_team.name} x {m.away_team.name} ({new Date(m.match_date).toLocaleDateString('pt-BR')})
                  </option>
                ))}
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
