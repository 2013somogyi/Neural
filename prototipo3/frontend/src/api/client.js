const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('nneural_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('nneural_token', token);
  } else {
    localStorage.removeItem('nneural_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && endpoint !== '/auth/login') {
    setAuthToken(null);
    window.dispatchEvent(new Event('nneural_unauthorized'));
    throw new Error(data.message || 'Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição da API');
  }

  return data;
}
