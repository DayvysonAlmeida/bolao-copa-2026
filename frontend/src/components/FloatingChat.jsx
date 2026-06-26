import { useState, useEffect, useRef } from 'react';

export function FloatingChat({ activeBolao, API_URL, accessToken, loggedUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef(null);
  
  // Fetch comments
  useEffect(() => {
    if (!activeBolao) return;
    
    const fetchComments = () => {
      fetch(`${API_URL}/bolao_comments/?bolao=${activeBolao.id}`)
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : (data.results || []);
          list.reverse(); // Mais antigas primeiro para scroll
          
          setComments(prev => {
            // Se a janela estiver fechada e houver novos comentários, aumenta o badge
            if (!isOpen && prev.length > 0 && list.length > prev.length) {
              setUnreadCount(count => count + (list.length - prev.length));
            }
            return list;
          });
        })
        .catch(console.error);
    };

    fetchComments();
    const interval = setInterval(fetchComments, 5000); // Polling a cada 5s
    return () => clearInterval(interval);
  }, [activeBolao, API_URL, isOpen]);

  // Scroll to bottom when opening or new comments arrive
  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, comments]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0); // Limpa o badge ao abrir
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !accessToken || !activeBolao) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/bolao_comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          bolao: activeBolao.id,
          text: newComment.trim()
        })
      });
      
      if (res.ok) {
        const posted = await res.json();
        setComments(prev => [...prev, posted]);
        setNewComment('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserColor = (userId) => {
    const colors = [
      'text-blue-400', 'text-pink-400', 'text-yellow-400', 
      'text-purple-400', 'text-orange-400', 'text-cyan-400', 
      'text-teal-400', 'text-rose-400'
    ];
    // Evita erro se userId for null
    if (!userId) return colors[0];
    return colors[userId % colors.length];
  };

  const getDisplayName = (c) => {
    if (c.first_name) {
      return `${c.first_name} ${c.last_name || ''}`.trim();
    }
    return c.username;
  };

  if (!activeBolao) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Janela do Chat */}
      {isOpen && (
        <div className="bg-dark-800 border border-dark-600 rounded-2xl shadow-2xl mb-4 w-80 sm:w-96 overflow-hidden flex flex-col animate-slide-up" style={{ height: '500px', maxHeight: '70vh' }}>
          {/* Header */}
          <div className="bg-dark-900 px-4 py-3 border-b border-dark-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="text-white font-bold text-sm">Resenha Global</h3>
                <p className="text-xs text-neon-green">{activeBolao.name}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-900/50">
            {comments.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-10">
                Nenhuma resenha ainda. Mande a primeira!
              </div>
            ) : (
              comments.map(c => {
                const isMe = loggedUser && c.user === loggedUser.id;
                return (
                  <div key={c.id} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end self-end ml-auto' : 'items-start'}`}>
                    <span className={`text-[10px] font-bold mb-1 px-1 ${isMe ? 'text-neon-green' : getUserColor(c.user)}`}>
                      {isMe ? 'Você' : getDisplayName(c)}
                    </span>
                    <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      isMe 
                        ? 'bg-neon-green text-black rounded-tr-sm' 
                        : 'bg-dark-700 text-gray-200 rounded-tl-sm'
                    }`}>
                      {c.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-dark-900 border-t border-dark-700">
            {loggedUser ? (
              <form onSubmit={handlePost} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mande sua zoação..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 bg-dark-800 border border-dark-600 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-green/50"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-neon-green text-black px-4 rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? '...' : '➤'}
                </button>
              </form>
            ) : (
              <div className="text-center text-xs text-gray-500 py-2">
                Faça login para participar da resenha.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botão Flutuante */}
      {!isOpen && (
        <button 
          onClick={handleOpen}
          className="w-16 h-16 bg-neon-green text-black rounded-full shadow-[0_0_20px_rgba(4,211,97,0.4)] flex items-center justify-center hover:scale-110 transition-transform relative"
        >
          <span className="text-2xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-dark-900 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
