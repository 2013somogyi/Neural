import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function CheckoutView({ onNavigate }) {
  const { selectedPlan } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('pix');

  return (
    <section className="flex-grow flex items-center justify-center p-6 bg-slate-100 min-h-screen">
      <div className="bg-dorfic-card w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-wallet text-orange-500"></i> Planos & Pagamento
        </h2>

        <div className="space-y-3 mb-6">
          <div className="p-4 border-2 border-orange-500 bg-orange-50/50 rounded-xl flex justify-between items-center">
            <div>
              <span className="font-bold text-orange-900 block uppercase">Plano - {selectedPlan}</span>
              <span className="text-xs text-slate-500">Acesso total a todas as funcionalidades DB</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="text-xs text-orange-600 underline font-bold"
            >
              Detalhamento
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Formas de pagamento:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label
              className={`border-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === 'pix' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="pix"
                checked={paymentMethod === 'pix'}
                onChange={() => setPaymentMethod('pix')}
                className="accent-orange-600"
              />
              <span className="font-bold text-sm text-slate-800">PIX</span>
            </label>

            <label
              className={`border-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === 'credito' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="credito"
                checked={paymentMethod === 'credito'}
                onChange={() => setPaymentMethod('credito')}
                className="accent-orange-600"
              />
              <span className="font-medium text-sm text-slate-600">Cartão de Crédito</span>
            </label>

            <label
              className={`border-2 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                paymentMethod === 'debito' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="debito"
                checked={paymentMethod === 'debito'}
                onChange={() => setPaymentMethod('debito')}
                className="accent-orange-600"
              />
              <span className="font-medium text-sm text-slate-600">Cartão de Débito</span>
            </label>
          </div>
        </div>

        {paymentMethod === 'pix' && (
          <div className="bg-white p-4 border border-orange-200 rounded-xl text-center mb-6 transition-all">
            <p className="text-xs text-slate-500 mb-2">Escaneie o QR Code Pix abaixo:</p>
            <div className="w-32 h-32 bg-slate-200 mx-auto rounded-lg flex items-center justify-center text-slate-400 border border-dashed border-slate-400">
              <i className="fa-solid fa-qrcode text-5xl text-orange-500"></i>
            </div>
          </div>
        )}

        {(paymentMethod === 'credito' || paymentMethod === 'debito') && (
          <div className="bg-white p-4 border border-orange-200 rounded-xl mb-6 transition-all">
            <p className="text-xs text-slate-500 mb-3 font-bold uppercase tracking-wider">
              {paymentMethod === 'credito' ? 'Dados do Cartão de Crédito' : 'Dados do Cartão de Débito'}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número do Cartão:</label>
                <input type="text" className="input-dorfic w-full text-sm" placeholder="0000 0000 0000 0000" maxLength="19" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome no Cartão:</label>
                <input type="text" className="input-dorfic w-full text-sm uppercase" placeholder="NOME COMO NO CARTÃO" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validade (MM/AA):</label>
                  <input type="text" className="input-dorfic w-full text-sm" placeholder="MM/AA" maxLength="5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CVV:</label>
                  <input type="password" className="input-dorfic w-full text-sm" placeholder="123" maxLength="4" />
                </div>
              </div>
              {paymentMethod === 'credito' && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Parcelamento:</label>
                  <select className="input-dorfic w-full text-sm">
                    <option>1x sem juros</option>
                    <option>2x sem juros</option>
                    <option>3x sem juros</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => onNavigate('landing')} className="btn-dorfic-secondary w-1/3 py-2.5">
            Voltar
          </button>
          <button type="button" onClick={() => onNavigate('cad-empresa')} className="btn-dorfic w-2/3 py-2.5">
            Continuar
          </button>
        </div>
      </div>
    </section>
  );
}
