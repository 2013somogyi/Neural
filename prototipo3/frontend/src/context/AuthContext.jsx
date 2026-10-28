import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Prime');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('nneural_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nneural_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nneural_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('nneural_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('nneural_unauthorized', handleUnauthorized);
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const login = async (loginUser, senha) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login: loginUser, senha })
    });

    setAuthToken(data.token);
    setUser(data.user);
    setEmpresa(data.empresa);
    return data;
  };

  const registerCompany = async (empresaData, admData) => {
    const data = await apiRequest('/auth/register-company', {
      method: 'POST',
      body: JSON.stringify({ empresa: empresaData, adm: admData })
    });
    return data;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setEmpresa(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      empresa,
      setEmpresa,
      loading,
      selectedPlan,
      setSelectedPlan,
      isDarkMode,
      toggleTheme,
      login,
      registerCompany,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
