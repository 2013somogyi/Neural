import { subscriptionPlans } from '../../../utils/subscriptionPlans'
import '../inicio/inicio.css'
import './cadastro.css'

function Planos({ aoNavegar, onChoosePlan }) {
    return (
        <div className="planos-page">
            <section className="planos-section" id="planos">
                <h1 className="inicioTitulo">
                    Escolha o plano ideal para a sua empresa
                </h1>

                <p className="inicioSubtitulo">
                    Gerencie Ordens de Serviço, Estoque, Clientes e Finanças com
                    tecnologia Neural.
                </p>

                <div className="inicioPlanos">
                    {subscriptionPlans.map(plan => (
                        <article className="plano-card" key={plan.id}>
                            <h3>{plan.name}</h3>
                            <p className="plano-card-descricao">{plan.description}</p>
                            <p className="plano-card-preco">{plan.priceLabel}<span>/mês</span></p>
                            <ul>
                                {plan.features.map(feature => (
                                    <li className={feature.includes('bloqueadas') ? 'landing-plan-locked' : ''} key={feature}>
                                        <i className="fa-solid" aria-hidden="true"></i>{feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className="botao-dorfic-2 botao-dorfic-animacao"
                                onClick={() => onChoosePlan
                                    ? onChoosePlan(plan.id)
                                    : aoNavegar('pagamento')}
                            >
                                Escolher {plan.name}
                            </button>
                        </article>
                    ))}
                </div>
                <p className="plano-notas">Assinaturas mensais. Consulte as condições antes de contratar.</p>
            </section>
        </div>
    )
}

export default Planos
