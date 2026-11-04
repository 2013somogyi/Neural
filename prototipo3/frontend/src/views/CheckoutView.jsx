import React, { useState } from 'react';
import { getSubscriptionPlan } from '../utils/subscriptionPlans';

export function CheckoutView({ planId, isPaid, onNavigate, onPaymentComplete, onContinue }) {
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const plan = getSubscriptionPlan(planId);

  const handleSubmit = event => {
    event.preventDefault();
    onPaymentComplete();
  };

  return (
    <section className="checkout-page">
      <div className="checkout-card bg-dorfic-card">
        <div className="checkout-heading">
          <span className="checkout-icon" aria-hidden="true">
            <i className={`fa-solid ${isPaid ? 'fa-circle-check' : 'fa-lock'}`}></i>
          </span>
          <p className="landing-eyebrow">{isPaid ? 'Pagamento simulado concluído' : 'Etapa 1 de 2'}</p>
          <h1>{isPaid ? 'Tudo certo com seu plano!' : 'Confirme seu plano'}</h1>
          <p>
            {isPaid
              ? 'Agora você pode continuar para o cadastro da sua empresa.'
              : 'Revise o plano escolhido. O pagamento é apenas uma simulação e não haverá cobrança real.'}
          </p>
        </div>

        <div className="checkout-summary">
          <div>
            <span>Plano selecionado</span>
            <strong>{plan.name}</strong>
          </div>
          <div className="checkout-price">
            <strong>{plan.priceLabel}</strong>
            <span>por mês</span>
          </div>
        </div>

        {!isPaid ? (
          <form onSubmit={handleSubmit}>
            <fieldset className="checkout-methods">
              <legend>Forma de pagamento (simulada)</legend>
              <label className={`checkout-method${paymentMethod === 'pix' ? ' checkout-method-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={event => setPaymentMethod(event.target.value)}
                />
                <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
                <span><strong>Pix</strong><small>Confirmação imediata</small></span>
              </label>
              <label className={`checkout-method${paymentMethod === 'card' ? ' checkout-method-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={event => setPaymentMethod(event.target.value)}
                />
                <i className="fa-regular fa-credit-card" aria-hidden="true"></i>
                <span><strong>Cartão</strong><small>Ambiente demonstrativo</small></span>
              </label>
            </fieldset>

            <div className="checkout-simulation-notice" role="note">
              <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
              <span>Esta etapa é demonstrativa. Nenhum dado financeiro será solicitado ou cobrado.</span>
            </div>

            <button type="submit" className="btn-dorfic checkout-primary-action">
              Simular pagamento aprovado
            </button>
          </form>
        ) : (
          <button type="button" className="btn-dorfic checkout-primary-action" onClick={onContinue}>
            Continuar para o cadastro da empresa
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        )}

        <button type="button" className="checkout-back-link" onClick={() => onNavigate('signup')}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
          Escolher outro plano
        </button>
      </div>
    </section>
  );
}
