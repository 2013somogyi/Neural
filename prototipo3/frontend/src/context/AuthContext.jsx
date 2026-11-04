import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [themePreference, setThemePreference] = useState(() => {
    const saved = localStorage.getItem('nneural_theme');
    return ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const userThemeKey = user
    ? `nneural_theme_user_${user.id_usuario || user.id_tecnico}`
    : 'nneural_theme';

  useEffect(() => {
    const saved = localStorage.getItem(userThemeKey);
    setThemePreference(['light', 'dark', 'system'].includes(saved) ? saved : 'system');
  }, [userThemeKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = themePreference === 'dark'
        || (themePreference === 'system' && mediaQuery.matches);
      setIsDarkMode(dark);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };

    applyTheme();
    if (themePreference === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [themePreference]);

  const updateThemePreference = preference => {
    setThemePreference(preference);
    localStorage.setItem('nneural_theme', preference);
    localStorage.setItem(userThemeKey, preference);
  };
  const toggleTheme = () => updateThemePreference(isDarkMode ? 'light' : 'dark');

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('nneural_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('nneural_unauthorized', handleUnauthorized);
    };
  }, []);

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
      isDarkMode,
      toggleTheme,
      themePreference,
      setThemePreference: updateThemePreference,
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
