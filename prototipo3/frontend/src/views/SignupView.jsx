import React, { useState } from 'react';

export function SignupView({ onNavigate, showToast }) {
  const [code, setCode] = useState('987654');

  const handleVerification = (e) => {
    e.preventDefault();
    if (code.trim() === '987654' || code.length === 6) {
      showToast('Código verificado com sucesso!');
      onNavigate('checkout');
    } else {
      showToast('Código de verificação inválido.', 'error');
    }
  };

  return (
    <section className="flex-grow flex items-center justify-center p-6 bg-slate-100 min-h-screen">
      <div className="bg-dorfic-card w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-dorfic-gradient rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-lg">
          N
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sing up</h2>
        <p className="text-slate-600 text-sm mb-4">Enviamos um código de verificação para:</p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 font-mono text-xs text-orange-800 mb-6">
          sei***a0@gmail.com
        </div>

        <form onSubmit={handleVerification} className="space-y-4">
          <div className="text-left">
            <label className="block text-sm font-bold text-slate-700 mb-1">Código:</label>
            <input
              type="text"
              className="input-dorfic w-full text-center text-xl tracking-widest font-mono"
              placeholder="123456"
              maxLength="6"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-dorfic w-full py-3 text-base">
            Verifica
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center text-xs border-t border-orange-100 pt-4">
          <button onClick={() => onNavigate('login')} className="text-slate-500 hover:text-orange-600 font-semibold">
            Log in
          </button>
          <button
            onClick={() => alert('Suporte N Neural acionado! Aguarde um instante.')}
            className="text-orange-600 font-bold flex items-center gap-1"
          >
            <i className="fa-solid fa-headset"></i> Falar com o suporte
          </button>
        </div>
      </div>
    </section>
  );
}
