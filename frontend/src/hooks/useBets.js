import { useState, useEffect } from 'react';

export function useBets(API_URL, accessToken, loggedUser, setShowLoginModal, setLoginError) {
  const [userBets, setUserBets] = useState([]);
  const [editingBetId, setEditingBetId] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [homeBet, setHomeBet] = useState('');
  const [awayBet, setHomeBetAway] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const betChangeDeadline = new Date('2026-06-10T23:59:59');
  const isBeforeBetChangeDeadline = new Date() <= betChangeDeadline;
  const betChangeDeadlineLabel = '10/06/2026';

  const fetchUserBets = async (token) => {
    try {
      const response = await fetch(`${API_URL}/my-bets/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUserBets(Array.isArray(data) ? data : []);
      } else {
        console.error('Falha ao buscar meus palpites:', data);
      }
    } catch (error) {
      console.error('Erro ao buscar palpites do usuário:', error);
    }
  };

  useEffect(() => {
    if (accessToken && loggedUser?.id) {
      fetchUserBets(accessToken);
    }
  }, [accessToken, loggedUser]);

  useEffect(() => {
    if (!statusMessage.text) return;

    const timer = setTimeout(() => {
      setStatusMessage({ type: '', text: '' });
    }, 5000);

    return () => clearTimeout(timer);
  }, [statusMessage]);

  const getUserBetForMatch = (matchId) => {
    return userBets.find(bet => bet.match === matchId) || null;
  };

  const handleOpenModal = (match) => {
    if (match.status === 'FINISHED') {
      alert("Este jogo já encerrou! Não é possível enviar palpites.");
      return;
    }

    if (!accessToken) {
      setSelectedMatch(match);
      setShowLoginModal(true);
      setLoginError('');
      return;
    }

    const existingBet = getUserBetForMatch(match.id);
    setSelectedMatch(match);
    setHomeBet(existingBet ? existingBet.home_score.toString() : '');
    setHomeBetAway(existingBet ? existingBet.away_score.toString() : '');
    setEditingBetId(existingBet ? existingBet.id : null);
    setStatusMessage({ type: '', text: '' });
  };

  const handleSaveBet = (e) => {
    e.preventDefault();
    if (homeBet === '' || awayBet === '') {
      setStatusMessage({ type: 'error', text: 'Preencha ambos os placares.' });
      return;
    }

    const betData = {
      user: loggedUser?.id ?? 1,
      match: selectedMatch.id,
      home_score: parseInt(homeBet),
      away_score: parseInt(awayBet)
    };

    const headers = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    };

    const url = editingBetId ? `${API_URL}/bets/${editingBetId}/` : `${API_URL}/bets/`;
    const method = editingBetId ? 'PUT' : 'POST';

    if (!isBeforeBetChangeDeadline) {
      setStatusMessage({ type: 'error', text: `O prazo para enviar ou alterar palpites terminou em ${betChangeDeadlineLabel}.` });
      return;
    }

    fetch(url, {
      method,
      headers,
      body: JSON.stringify(betData)
    })
    .then(async response => {
      const data = await response.json();
      if (response.ok) {
        setStatusMessage({ type: 'success', text: editingBetId ? 'Palpite atualizado! 🚀' : 'Palpite registrado! 🚀' });
        setEditingBetId(null);
        if (loggedUser?.id) {
          fetchUserBets(accessToken);
        }
        setTimeout(() => setSelectedMatch(null), 1500);
      } else {
        if (JSON.stringify(data).includes('unique')) {
          setStatusMessage({ type: 'error', text: 'Você já palpitou neste jogo!' });
        } else {
          setStatusMessage({ type: 'error', text: data.non_field_errors?.[0] || 'Erro ao salvar palpite.' });
        }
      }
    })
    .catch(error => {
      console.error("Erro:", error);
      setStatusMessage({ type: 'error', text: 'Erro de conexão.' });
    });
  };

  return {
    userBets, setUserBets,
    editingBetId, setEditingBetId,
    selectedMatch, setSelectedMatch,
    homeBet, setHomeBet,
    awayBet, setHomeBetAway,
    statusMessage, setStatusMessage,
    betChangeDeadlineLabel,
    isBeforeBetChangeDeadline,
    fetchUserBets,
    getUserBetForMatch,
    handleOpenModal,
    handleSaveBet
  };
}
