import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingView } from './views/LandingView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { CadEmpresaView } from './views/CadEmpresaView';
import { CadAdmView } from './views/CadAdmView';
import { CheckoutView } from './views/CheckoutView';
import { MainLayout } from './layouts/MainLayout';
import '@fortawesome/fontawesome-free/css/all.min.css';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [toast, setToast] = useState(null);
  const [tempEmpresa, setTempEmpresa] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [paidPlanId, setPaidPlanId] = useState(null);
  const { user } = useAuth();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleNavigate = (screen) => {
    let nextScreen = screen;
    if (screen === 'cad-empresa' || screen === 'cad-adm') {
      nextScreen = paidPlanId ? screen : 'signup';
    } else if (screen === 'checkout' && !selectedPlanId) {
      nextScreen = 'signup';
    }

    const publicScreens = ['landing', 'login', 'signup', 'checkout', 'cad-empresa', 'cad-adm', 'main'];
    setCurrentScreen(publicScreens.includes(nextScreen) ? nextScreen : 'landing');
    window.scrollTo(0, 0);
  };

  const handleChoosePlan = planId => {
    setSelectedPlanId(planId);
    setPaidPlanId(null);
    setCurrentScreen('checkout');
    window.scrollTo(0, 0);
  };

  const handlePaymentComplete = () => {
    setPaidPlanId(selectedPlanId);
  };

  const continueRegistration = () => {
    if (!paidPlanId) return;
    setCurrentScreen('cad-empresa');
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

      {!showMain && currentScreen !== 'landing' && (
        <header className="public-flow-header">
          <a href="#" onClick={event => { event.preventDefault(); handleNavigate('landing'); }} className="public-flow-brand">
            <span className="landing-brand-mark" aria-hidden="true">N</span>
            <span>N Neural</span>
          </a>
          <button type="button" className="btn-dorfic-secondary public-flow-home" onClick={() => handleNavigate('landing')}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
            <span className="public-flow-home-label">Voltar para o início</span>
            <span className="public-flow-home-short">Início</span>
          </button>
        </header>
      )}

      {showMain ? (
        <MainLayout onNavigate={handleNavigate} showToast={showToast} />
      ) : (
        <>
          {currentScreen === 'landing' && <LandingView onNavigate={handleNavigate} onChoosePlan={handleChoosePlan} />}
          {currentScreen === 'login' && <LoginView onNavigate={handleNavigate} showToast={showToast} />}
          {currentScreen === 'signup' && <SignupView onNavigate={handleNavigate} onChoosePlan={handleChoosePlan} />}
          {currentScreen === 'checkout' && (
            <CheckoutView
              planId={selectedPlanId}
              isPaid={paidPlanId === selectedPlanId}
              onNavigate={handleNavigate}
              onPaymentComplete={handlePaymentComplete}
              onContinue={continueRegistration}
            />
          )}
          {currentScreen === 'cad-empresa' && paidPlanId && (
            <CadEmpresaView
              onNavigate={handleNavigate}
              showToast={showToast}
              onSaveTempEmpresa={data => setTempEmpresa(data)}
            />
          )}
          {currentScreen === 'cad-adm' && paidPlanId && (
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
