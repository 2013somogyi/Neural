import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { CheckoutView } from './views/CheckoutView';
import { CadEmpresaView } from './views/CadEmpresaView';
import { CadAdmView } from './views/CadAdmView';
import { MainLayout } from './layouts/MainLayout';
import '@fortawesome/fontawesome-free/css/all.min.css';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [toast, setToast] = useState(null);
  const [tempEmpresa, setTempEmpresa] = useState(null);
  const { user } = useAuth();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  // If logged in and on a public screen, or explicitly navigated to main
  const showMain = user && currentScreen === 'main';

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-slate-100">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
          <div className={`p-4 rounded-xl text-xs font-bold text-white shadow-xl transition-all duration-300 ${
            toast.type === 'success' ? 'bg-orange-600' : 'bg-red-600'
          }`}>
            <i className="fa-solid fa-circle-info mr-2"></i> {toast.message}
          </div>
        </div>
      )}

      {showMain ? (
        <MainLayout onNavigate={handleNavigate} showToast={showToast} />
      ) : (
        <>
          {currentScreen === 'landing' && <LandingView onNavigate={handleNavigate} />}
          {currentScreen === 'login' && <LoginView onNavigate={handleNavigate} showToast={showToast} />}
          {currentScreen === 'signup' && <SignupView onNavigate={handleNavigate} showToast={showToast} />}
          {currentScreen === 'checkout' && <CheckoutView onNavigate={handleNavigate} />}
          {currentScreen === 'cad-empresa' && (
            <CadEmpresaView
              onNavigate={handleNavigate}
              showToast={showToast}
              onSaveTempEmpresa={data => setTempEmpresa(data)}
            />
          )}
          {currentScreen === 'cad-adm' && (
            <CadAdmView
              onNavigate={handleNavigate}
              showToast={showToast}
              tempEmpresa={tempEmpresa}
            />
          )}
          {currentScreen === 'main' && !user && (
            <LoginView onNavigate={handleNavigate} showToast={showToast} />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
