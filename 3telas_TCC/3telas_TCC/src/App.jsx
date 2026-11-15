import { useState } from 'react'
import './App.css'

import Inicio from './telas/auth/inicio/inicio.jsx'
import Login from './telas/auth/entrar/login.jsx'
import Cadastro from './telas/auth/cadastrar/cadastro.jsx'
import { TelaPagamento } from './telas/auth/cadastrar/pagamento.jsx'
import Planos from './telas/auth/cadastrar/planos.jsx'

import Header from './components/header/headerHome.jsx'
import HeaderSite from './components/header/headerSite.jsx'
import HeaderLog from './components/header/headerLog.jsx'
import Footer from './components/footer/footer.jsx'

function App() {
  const [telaAtual, setTelaAtual] = useState('inicio')
  const [menuAberto, setMenuAberto] = useState(false)
  const [selecionadoPlanId, setSelecionadoPlanId] = useState(null);
  const [pagPlanId, setPagPlanId] = useState(null);


  const gerenciarNavegacao = tela => {
    setTelaAtual(tela)
    window.scrollTo(0, 0);
  }

  const escolhaPlano = planId => {
    setSelecionadoPlanId(planId)
    setPagPlanId(null)
    setTelaAtual('pagamento')
    window.scrollTo(0, 0);
  }

  const configPagComplet = () => {
    setPagPlanId(selecionadoPlanId);
  };

  const continueRegistration = () => {
    if (!pagPlanId) return;
    setTelaAtual('cad-empresa');
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <header>
        {/* telas inicias */}
        {telaAtual === 'inicio' && <Header aoNavegar={setTelaAtual} />}
        {(telaAtual === 'login'|| telaAtual === 'planos') && (<HeaderLog aoNavegar={setTelaAtual} />)}

        {/* site */}
        {telaAtual === 'cad-empresa' && ( <HeaderSite aoNavegar={setTelaAtual} menuAberto={menuAberto} setMenuAberto={setMenuAberto}/> )}
      </header>

      <main className="conteudo">
        {telaAtual === 'inicio' && <Inicio aoNavegar={setTelaAtual} onChoosePlan={escolhaPlano} />}
        {telaAtual === 'planos' && <Planos aoNavegar={setTelaAtual} onChoosePlan={escolhaPlano} />}
        {telaAtual === 'login' && <Login aoNavegar={setTelaAtual} />}
        {telaAtual === 'cad-empresa' && <Cadastro aoNavegar={setTelaAtual} onChoosePlan={escolhaPlano} />}

        {telaAtual === 'pagamento' && (
          <TelaPagamento
            planId={selecionadoPlanId}
            pago={pagPlanId === selecionadoPlanId}
            onNavigate={gerenciarNavegacao}
            onPagamentoComplet={configPagComplet}
            onContinue={continueRegistration}
          />
        )}
      </main>
      <footer>
        {telaAtual === 'inicio' && <Footer aoNavegar={setTelaAtual} />}
        {telaAtual === 'planos' && <Footer aoNavegar={setTelaAtual} />}
        {telaAtual === 'login' && <Footer aoNavegar={setTelaAtual} />}
        {telaAtual === 'cad-empresa' && <Footer aoNavegar={setTelaAtual} />}
      </footer>
    </div>
  )
}

export default App