import { useState } from 'react'
import { getSubscriptionPlan } from '../../../utils/subscriptionPlans'
import './cadastro.css'

export function TelaPagamento({ planId, pago, onNavigate, onPagamentoComplet, onContinue }) {
  const [formaPagamento, setFormaPagamento] = useState('cartao')
  const plano = getSubscriptionPlan(planId)

  const processarPagamento = event => {
    event.preventDefault()
    onPagamentoComplet()
  }

  return (
    <section className="pagamento">
      <article className="pagamento-painel">
        <header className="pagamento-topo">
          <span className="pagamento-icone" aria-hidden="true">
            {pago ? "✔️" : "🔒"}
          </span>
          <p className="etapa">{pago ? 'Pagamento simulado concluído' : 'Etapa 1 de 2'}</p>
          <h1>{pago ? 'Tudo certo com seu plano!' : 'Confirme seu plano'}</h1>
          <p>
            {pago
              ? 'Agora você pode continuar para o cadastro da sua empresa.'
              : 'Revise o plano escolhido. O pagamento é apenas uma simulação e não haverá cobrança real.'}
          </p>
        </header>

        <div className="plano-resumo">
          <div>
            <span>Plano selecionado</span>
            <strong>{plano.name}</strong>
          </div>
          <div className="plano-preco">
            <strong>{plano.priceLabel}</strong>
            <span>Por mês</span>
          </div>
        </div>

        {!pago ? (
          <form onSubmit={processarPagamento}>
            <fieldset className="formas-pag">
              <legend>Forma de pagamento (simulado)</legend>
              
              <label className={`forma-pag${formaPagamento === 'pix' ? ' selecionada' : ''}`}>
                <input
                  type="radio"
                  name="forma-pagamento"
                  value="pix"
                  checked={formaPagamento === 'pix'}
                  onChange={event => setFormaPagamento(event.target.value)}
                />
                <i className="fa-solid fa-credit-card" aria-hidden="true" />
                <span>
                  <strong>Pix</strong>
                  <small>Confirmação imediata</small>
                </span>
              </label>
              <label className={`forma-pag${formaPagamento === 'cartao' ? ' selecionada' : ''}`}>
                <input
                  type="radio"
                  name="forma-pagamento"
                  value="cartao"
                  checked={formaPagamento === 'cartao'}
                  onChange={event => setFormaPagamento(event.target.value)}
                />
                <i className="fa-solid fa-credit-card" aria-hidden="true" />
                <span>
                  <strong>Cartão</strong>
                  <small>Ambiente demonstrativo</small>
                </span>
              </label>
              
            </fieldset>

            <p className="aviso-pag">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <span>Esta etapa é demonstrativa. Nenhum dado financeiro será solicitado ou cobrado.</span>
            </p>

            <button className="botao-principal" type="submit">
              Simular pagamento aprovado
            </button>
          </form>
        ) : (
          <button className="botao-principal" type="button" onClick={onContinue}>
            Continuar para o cadastro da empresa
          </button>
        )}

        <button className="voltar-planos" type="button" onClick={() => onNavigate('planos')}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Escolher outro plano
        </button>
      </article>
    </section>
  )
}