import { useState } from 'react';

export function useAuth(API_URL, fetchUserBets) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [loggedUser, setLoggedUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regUsername, setRegUsername] = useState('');
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
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      setLoggedUser({ id: userId, username: usernameInput });
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
    if (!regUsername || !regPassword || !regConfirmPassword) {
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
        body: JSON.stringify({ username: regUsername, password: regPassword })
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
        
        setAccessToken(loginData.access);
        setRefreshToken(loginData.refresh);
        setLoggedUser({ id: userId, username: regUsername });
        
        setShowRegisterModal(false);
        setRegisterError('');
        setRegUsername('');
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
    loggedUser,
    showLoginModal, setShowLoginModal,
    showRegisterModal, setShowRegisterModal,
    regUsername, setRegUsername,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    registerError, setRegisterError,
    isLoggedIn,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout
  };
}
