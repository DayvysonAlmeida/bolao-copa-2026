import { useState } from 'react';

export function useAuth(API_URL, fetchUserBets) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '');
  const [loggedUser, setLoggedUser] = useState(() => {
    const saved = localStorage.getItem('loggedUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');

  const isLoggedIn = Boolean(loggedUser);

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleLoginSubmit = async (e, setStatusMessage) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setLoginError('Preencha usuário e senha.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      const data = await response.json();
      if (!response.ok) {
        setLoginError('Usuário ou senha inválidos.');
        return;
      }

      const payload = parseJwt(data.access);
      const userId = payload?.user_id ?? null;
      
      // Busca os dados completos do perfil
      let userObj = { id: userId, username: usernameInput };
      try {
        const profileRes = await fetch(`${API_URL}/me/`, {
          headers: { 'Authorization': `Bearer ${data.access}` }
        });
        if (profileRes.ok) {
          userObj = await profileRes.json();
        }
      } catch (e) { console.error('Erro ao buscar perfil:', e); }

      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setLoggedUser(userObj);
      
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('loggedUser', JSON.stringify(userObj));
      setShowLoginModal(false);
      setLoginError('');
      setUsernameInput('');
      setPasswordInput('');
      setStatusMessage({ type: 'success', text: 'Login realizado. Agora envie seu palpite.' });
      if (userId) {
        await fetchUserBets(data.access);
      }
    } catch (error) {
      console.error('Erro de login:', error);
      setLoginError('Erro de conexão ao autenticar.');
    }
  };

  const handleRegisterSubmit = async (e, setStatusMessage) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regConfirmPassword || !regFirstName || !regLastName || !regEmail) {
      setRegisterError('Preencha todos os campos.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegisterError('As senhas não coincidem.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: regUsername, 
          password: regPassword,
          first_name: regFirstName,
          last_name: regLastName,
          email: regEmail
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || 'Erro ao criar conta.');
        return;
      }

      // Conta criada com sucesso! Já fazemos o login automático do usuário para facilitar
      const loginResponse = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        const payload = parseJwt(loginData.access);
        const userId = payload?.user_id ?? null;
        
        let userObj = { id: userId, username: regUsername };
        try {
          const profileRes = await fetch(`${API_URL}/me/`, {
            headers: { 'Authorization': `Bearer ${loginData.access}` }
          });
          if (profileRes.ok) {
            userObj = await profileRes.json();
          }
        } catch (e) { console.error('Erro ao buscar perfil:', e); }
        
        setAccessToken(loginData.access);
        setRefreshToken(loginData.refresh);
        setLoggedUser(userObj);
        
        localStorage.setItem('accessToken', loginData.access);
        localStorage.setItem('refreshToken', loginData.refresh);
        localStorage.setItem('loggedUser', JSON.stringify(userObj));
        
        setShowRegisterModal(false);
        setRegisterError('');
        setRegUsername('');
        setRegFirstName('');
        setRegLastName('');
        setRegEmail('');
        setRegPassword('');
        setRegConfirmPassword('');
        setStatusMessage({ type: 'success', text: 'Conta criada com sucesso! Você já está logado.' });
        
        if (userId) {
          await fetchUserBets(loginData.access);
        }
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setRegisterError('Erro de conexão ao tentar cadastrar.');
    }
  };

  const handleLogout = (setUserBets, setEditingBetId, setSelectedMatch, setStatusMessage) => {
    setAccessToken('');
    setRefreshToken('');
    setLoggedUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('loggedUser');
    setUserBets([]);
    setEditingBetId(null);
    setSelectedMatch(null);
    setShowLoginModal(false);
    setStatusMessage({ type: 'success', text: 'Você saiu da conta.' });
  };

  return {
    usernameInput, setUsernameInput,
    passwordInput, setPasswordInput,
    loginError, setLoginError,
    accessToken,
    refreshToken,
    loggedUser, setLoggedUser,
    showLoginModal, setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    regUsername, setRegUsername,
    regFirstName, setRegFirstName,
    regLastName, setRegLastName,
    regEmail, setRegEmail,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    registerError, setRegisterError,
    isLoggedIn,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout
  };
}
