import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginView({ onNavigate, showToast }) {
  const [loginUser, setLoginUser] = useState('admin');
  const [senha, setSenha] = useState('123456');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginUser, senha);
      showToast('Login efetuado com sucesso!');
      onNavigate('main');
    } catch (err) {
      showToast(err.message || 'Erro ao realizar login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex-grow flex items-center justify-center p-6 bg-slate-100 min-h-screen">
      <div className="bg-dorfic-card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-dorfic-gradient rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-3 shadow-lg">
            N
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Acessar a Plataforma</h2>
          <p className="text-slate-500 text-sm">Digite suas credenciais N Neural</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Login:</label>
            <input
              type="text"
              className="input-dorfic w-full"
              placeholder="Seu login global ou email"
              value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Senha:</label>
            <input
              type="password"
              className="input-dorfic w-full"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => alert('Instruções de recuperação enviadas para o email cadastrado.')}
              className="text-orange-600 font-semibold hover:underline"
            >
              Esqueci a senha
            </button>
          </div>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="btn-dorfic-secondary w-1/3 py-2.5"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-dorfic w-2/3 py-2.5"
            >
              {loading ? 'Acessando...' : 'Logar'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm border-t border-orange-100 pt-4">
          Ainda não tem conta?{' '}
          <button onClick={() => onNavigate('signup')} className="text-orange-600 font-bold hover:underline">
            Sing up
          </button>
        </div>
      </div>
    </section>
  );
}
