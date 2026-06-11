import { useState, useEffect } from 'react';

export function ProfileModal({ 
  showProfileModal, 
  setShowProfileModal, 
  loggedUser, 
  setLoggedUser,
  accessToken,
  API_URL
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (showProfileModal && loggedUser) {
      setFirstName(loggedUser.first_name || '');
      setLastName(loggedUser.last_name || '');
      setEmail(loggedUser.email || '');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordFields(false);
      setMessage({ text: '', type: '' });
    }
  }, [showProfileModal, loggedUser]);

  if (!showProfileModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: email,
    };

    if (password) {
      payload.password = password;
    }

    try {
      const response = await fetch(`${API_URL}/me/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setLoggedUser(updatedUser);
        localStorage.setItem('loggedUser', JSON.stringify(updatedUser));
        setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
        setPassword('');
        setConfirmPassword('');
        
        setTimeout(() => {
          setShowProfileModal(false);
        }, 2000);
      } else {
        const data = await response.json();
        setMessage({ text: data.error || 'Erro ao atualizar o perfil.', type: 'error' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Erro de conexão.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-dark-800 border border-dark-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative my-8">
        <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        <h3 className="text-center text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">
          Meu Perfil
        </h3>
        <p className="text-center text-sm text-gray-400 mb-6">Altere seus dados ou senha.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm text-gray-300 mb-2">Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm text-gray-300 mb-2">Sobrenome</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
            />
          </div>
          
          <div className="h-px bg-dark-700 my-4"></div>
          
          {!showPasswordFields ? (
            <button 
              type="button" 
              onClick={() => setShowPasswordFields(true)}
              className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-gray-300 hover:text-white hover:border-neon-green transition-all"
            >
              Alterar senha
            </button>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-gray-500 mb-2">Preencha abaixo a nova senha que deseja utilizar.</p>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Nova Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-white focus:border-neon-green focus:outline-none"
                />
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowPasswordFields(false);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-xs text-red-400 hover:text-red-300 hover:underline"
              >
                Cancelar alteração de senha
              </button>
            </div>
          )}

          {message.text && (
            <div className={`text-sm rounded-xl p-3 text-center ${message.type === 'error' ? 'text-red-400 bg-red-950 border border-red-900' : 'text-green-400 bg-green-950 border border-green-900'}`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-3 rounded-xl transition-all">Cancelar</button>
            <button type="submit" disabled={isSaving} className={`flex-1 font-bold py-3 rounded-xl transition-all ${isSaving ? 'bg-dark-600 text-gray-400 cursor-not-allowed' : 'bg-neon-green hover:bg-opacity-90 text-dark-900 shadow-lg shadow-neon-green/20'}`}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
