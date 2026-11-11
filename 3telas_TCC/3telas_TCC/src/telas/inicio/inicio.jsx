import './inicio.css';
import { recursos } from '../../utils/recursos';
import { subscriptionPlans } from '../../utils/subscriptionPlans';

function Inicio({ aoNavegar }) {
    return (
        <div className="inicioPai">
            <div className="inicioContainer">

            {/* secão inicial */}
                <section className="landi-page-topo" id="inicio">
                    <div className="landi-hero-inner">

                        <div className="landi-page-topo-content">
                            <div className="text-page-topo">
                                <span className="text-simples-topo">
                                    <p>Gestão para assistências técnicas</p>
                                </span>
                                <h1>
                                    Sua assistência em ordem. Seu próximo passo, mais perto.
                                </h1>
                                <p className="text-descricao-topo">
                                    Organize ordens de serviço, clientes, equipe e estoque em uma
                                    plataforma feita para simplificar o dia a dia da sua empresa.
                                </p>
                            </div>

                            <div className="landi-page-actions">
                                <a href="#planos" className="btnSignup btnGrande">
                                    Ver planos
                                </a>

                                <button
                                    className="btnLogin btnGrande"
                                    onClick={() => aoNavegar('cadastro')}
                                >
                                    Criar minha conta
                                </button>
                            </div>
                                <p className="landi-page-hint">
                                    Mais clareza para cuidar de cada atendimento.
                                </p>
                        </div>

                        <div className="recursos-grid">
                            {/* bolinhas do fundo */}
                            <div className="bolinhas-fundo bolinha1"></div>
                            <div className="bolinhas-fundo bolinha2"></div>
                            {/* grid de recursos */}
                            <div className="recursos-nuvem">

                                <div className="recursos-titulo">
                                    <span className="recursos-fundo-icon">
                                        esq
                                    </span>
                                    <strong>Ordens de serviço</strong>
                                </div>
                                <div className="recursos-titulo">
                                    <span className="recursos-fundo-icon">
                                        esq
                                    </span>
                                    <strong>Ordens de serviço</strong>
                                </div>

                                <div className="recursos-titulo">
                                    <span className="recursos-fundo-icon">
                                        dir
                                    </span>
                                    <strong>Estoque integrado</strong>
                                </div>

                                <div className="recursos-titulo">
                                    <span className="recursos-fundo-icon">
                                        esq
                                    </span>
                                    <strong>Gestão de equipe</strong>
                                </div>

                                
                            </div>
                        </div>

                    </div>
                </section>
                
            {/* seção de recursos */}
                <section className="recursos-section" id="recursos">
                    <div className='recursos-texto'>
                        <p className="texto-chamativo">Uma rotina mais leve</p>
                        <h2>O que você precisa para cuidar do negócio</h2>
                        <p>Menos tarefas espalhadas. Mais tempo para atender bem e fazer sua empresa avançar.</p>
                    </div>

                    <div className="recursos-cards">
                        {recursos.map((beneficio, index) => ( 
                            <article className="recursos-cards-grid" key={index}> {/* o map precisa de uma key única para cada elemento renderizado. resumo: frescura do react */}
                                <span className="recursos-numero">0{index + 1}</span>
                                <i className={`fas ${beneficio.icon} recursos-icon`}>a</i>
                                <h3>{beneficio.title}</h3>
                                <p>{beneficio.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* secao dos PLANOS */}
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
                            <article className={`plano-card`} key={plan.name}>
                                <h3>{plan.name}</h3>
                                <p className="plano-card-descricao">{plan.description}</p>
                                <p className="plano-card-preco">{plan.priceLabel}<span>/mês</span></p>
                                <ul>
                                {plan.features.map(feature => (
                                    <li className={feature.includes('bloqueadas') ? 'landing-plan-locked' : ''} key={feature}>
                                    <i className={`fa-solid`} aria-hidden="true"></i>{feature}
                                    </li>
                                ))}
                                </ul>
                                <button type="button" className={'botao-dorfic-2 botao-dorfic-animacao'} onClick={() =>    onChoosePlan(plan.id)}>
                                Escolher {plan.name}
                                </button>
                            </article>
                        ))}
                    </div>
                    <p className="plano-notas">Assinaturas mensais. Consulte as condições antes de contratar.</p>
                </section>
                <section className="comecar-agr" id="contato">
                    <div>
                        <p className="text-simples-topo">Pronto para Organizar sua Empresa?</p>
                        <h2>Comece hoje a cuidar melhor de cada serviço.</h2>
                        <p>escolha o plano ideal para a sua empresa e comece a usar a plataforma.</p>
                    </div>
                    
                    <button className="btnLogin btnGrande" onClick={() => aoNavegar('cadastro')}>Começar agora</button>
                </section>

            </div>
        </div>
    );
}

export default Inicio;