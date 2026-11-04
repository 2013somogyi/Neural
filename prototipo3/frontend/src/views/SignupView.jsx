import React from 'react';
import { subscriptionPlans } from '../utils/subscriptionPlans';

export function SignupView({ onNavigate, onChoosePlan }) {
  return (
    <section className="signup-page">
      <div className="signup-content">
        <div className="signup-heading">
          <p className="landing-eyebrow">Comece com o plano ideal</p>
          <h1>Escolha seu plano</h1>
          <p>O pagamento é simulado nesta etapa. Depois da confirmação, você cadastra sua empresa.</p>
        </div>
        <div className="signup-plan-grid">
          {subscriptionPlans.map(plan => (
            <article className={`signup-plan-card${plan.featured ? ' signup-plan-featured' : ''}`} key={plan.id}>
              {plan.featured && <span className="landing-plan-badge">Mais escolhido</span>}
              <h2>{plan.name}</h2>
              <p>{plan.description}</p>
              <strong className="signup-plan-price">{plan.priceLabel}<span>/mês</span></strong>
              <ul>
                {plan.features.map(feature => (
                  <li className={feature.includes('bloqueadas') ? 'landing-plan-locked' : ''} key={feature}>
                    <i className={`fa-solid ${feature.includes('bloqueadas') ? 'fa-lock' : 'fa-check'}`} aria-hidden="true"></i>
                    {feature}
                  </li>
                ))}
              </ul>
              <button type="button" className={plan.featured ? 'btn-dorfic signup-plan-action' : 'btn-dorfic-secondary signup-plan-action'} onClick={() => onChoosePlan(plan.id)}>
                Continuar para pagamento
              </button>
            </article>
          ))}
        </div>
        <div className="signup-footer-links">
          <span>Já tem conta?</span>
          <button onClick={() => onNavigate('login')} className="font-bold text-orange-700 hover:underline">Entrar</button>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="signup-back-link"
        >
          Voltar para a página inicial
        </button>
      </div>
    </section>
  );
}
