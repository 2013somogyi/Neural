import React from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionPlans } from '../utils/subscriptionPlans';

const benefits = [
  {
    icon: 'fa-clipboard-list',
    title: 'Ordens sob controle',
    description: 'Acompanhe cada atendimento da entrada à conclusão, com histórico e status sempre atualizados.'
  },
  {
    icon: 'fa-users',
    title: 'Relacionamento organizado',
    description: 'Centralize clientes, fornecedores e equipe para encontrar as informações em poucos segundos.'
  },
  {
    icon: 'fa-boxes-stacked',
    title: 'Estoque conectado',
    description: 'Registre peças e movimentações junto às ordens de serviço da sua assistência.'
  },
  {
    icon: 'fa-chart-line',
    title: 'Visão do negócio',
    description: 'Consulte indicadores e relatórios para acompanhar a operação com mais clareza.'
  }
];

export function LandingView({ onNavigate, onChoosePlan }) {
  const { isDarkMode, toggleTheme } = useAuth();

  const startSignup = () => onNavigate('signup');

  return (
    <div className={`landing-page ${isDarkMode ? 'landing-dark' : 'landing-light'}`}>
      <header className="landing-header">
        <a className="landing-brand" href="#inicio" aria-label="N Neural, início">
          <span className="landing-brand-mark" aria-hidden="true">N</span>
          <span>N Neural</span>
        </a>

        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#planos">Planos</a>
          <a href="#contato">Contato</a>
        </nav>

        <div className="landing-header-actions">
          <button
            type="button"
            className="landing-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Tema ${isDarkMode ? 'escuro' : 'claro'} ativo. Alternar para tema ${isDarkMode ? 'claro' : 'escuro'}`}
            title={`Alternar para tema ${isDarkMode ? 'claro' : 'escuro'}`}
          >
            <i
              className={isDarkMode
                ? 'fa-solid fa-sun theme-icon text-orange-400'
                : 'fa-solid fa-moon theme-icon text-slate-600'}
              aria-hidden="true"
            ></i>
          </button>
          <button type="button" onClick={() => onNavigate('login')} className="btn-dorfic-secondary landing-login">
            Entrar
          </button>
          <button type="button" onClick={() => onNavigate('signup')} className="btn-dorfic landing-signup">
            Cadastrar
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="inicio">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow"><span aria-hidden="true"></span> Gestão para assistências técnicas</p>
            <h1>Sua assistência em ordem. Seu próximo passo, mais perto.</h1>
            <p className="landing-hero-description">
              Organize ordens de serviço, clientes, equipe e estoque em uma plataforma feita para simplificar o dia a dia da sua empresa.
            </p>
            <div className="landing-hero-actions">
              <a className="btn-dorfic landing-primary-cta" href="#planos">
                Ver planos <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
              <button type="button" className="btn-dorfic-secondary landing-secondary-cta" onClick={startSignup}>
                Criar minha conta
              </button>
            </div>
            <div className="landing-proof">
              <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
              <span>Mais clareza para cuidar de cada atendimento.</span>
            </div>
          </div>

          <div className="landing-hero-visual" aria-label="Recursos da plataforma">
            <div className="landing-orbit landing-orbit-one"></div>
            <div className="landing-orbit landing-orbit-two"></div>
            <div className="landing-feature-cloud">
              {[
                ['fa-clipboard-list', 'Ordens de serviço'],
                ['fa-boxes-stacked', 'Estoque integrado'],
                ['fa-users', 'Gestão de equipe'],
                ['fa-chart-line', 'Visão do negócio']
              ].map(([icon, label], index) => (
                <div className={`landing-feature-tile landing-feature-tile-${index + 1}`} key={label}>
                  <span><i className={`fa-solid ${icon}`} aria-hidden="true"></i></span>
                  <strong>{label}</strong>
                </div>
              ))}
            </div>
            <div className="landing-floating-note">
              <span><i className="fa-solid fa-check" aria-hidden="true"></i></span>
              <div><strong>Informações conectadas</strong><small>Uma rotina mais organizada</small></div>
            </div>
          </div>
        </section>

        <section className="landing-benefits landing-section" id="recursos">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Uma rotina mais leve</p>
            <h2>O que você precisa para cuidar do negócio</h2>
            <p>Menos tarefas espalhadas. Mais tempo para atender bem e fazer sua empresa avançar.</p>
          </div>
          <div className="landing-benefit-grid">
            {benefits.map((benefit, index) => (
              <article className="landing-benefit-card" key={benefit.title}>
                <span className="landing-benefit-icon"><i className={`fa-solid ${benefit.icon}`} aria-hidden="true"></i></span>
                <span className="landing-card-index">0{index + 1}</span>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-plans landing-section" id="planos">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Planos para cada momento</p>
            <h2>Escolha como quer avançar</h2>
            <p>Comece pelo essencial e encontre o formato ideal para a sua operação.</p>
          </div>
          <div className="landing-plan-grid landing-plan-grid-two">
            {subscriptionPlans.map(plan => (
              <article className={`landing-plan-card${plan.featured ? ' landing-plan-featured' : ''}`} key={plan.name}>
                {plan.featured && <span className="landing-plan-badge">Mais escolhido</span>}
                <h3>{plan.name}</h3>
                <p className="landing-plan-description">{plan.description}</p>
                <p className="landing-plan-price">{plan.priceLabel}<span>/mês</span></p>
                <ul>
                  {plan.features.map(feature => (
                    <li className={feature.includes('bloqueadas') ? 'landing-plan-locked' : ''} key={feature}>
                      <i className={`fa-solid ${feature.includes('bloqueadas') ? 'fa-lock' : 'fa-check'}`} aria-hidden="true"></i>{feature}
                    </li>
                  ))}
                </ul>
                <button type="button" className={plan.featured ? 'btn-dorfic landing-plan-cta' : 'btn-dorfic-secondary landing-plan-cta'} onClick={() => onChoosePlan(plan.id)}>
                  Escolher {plan.name}
                </button>
              </article>
            ))}
          </div>
          <p className="landing-pricing-note">Assinaturas mensais. Consulte as condições antes de contratar.</p>
        </section>

        <section className="landing-contact" id="contato">
          <div>
            <p className="landing-eyebrow">Pronto para organizar sua rotina?</p>
            <h2>Comece hoje a cuidar melhor de cada serviço.</h2>
            <p>Crie o cadastro da sua empresa e conheça a plataforma.</p>
          </div>
          <button type="button" className="btn-dorfic landing-contact-cta" onClick={startSignup}>
            Começar agora <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="landing-brand" href="#inicio" aria-label="N Neural, voltar ao início">
          <span className="landing-brand-mark" aria-hidden="true">N</span>
          <span>N Neural</span>
        </a>
        <p>Gestão simples para uma assistência em movimento.</p>
        <span>© N Neural</span>
      </footer>
    </div>
  );
}
