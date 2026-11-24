import { useState } from 'react'
import './App.css'

import Inicio from './telas/auth/inicio/inicio.jsx'
import Login from './telas/auth/entrar/login.jsx'
import { CadEmpresa } from './telas/auth/cadastrar/cadEmpresa.jsx'
import { CadAdm } from './telas/auth/cadastrar/cadAdm.jsx'
import { TelaPagamento } from './telas/auth/cadastrar/pagamento.jsx'
import Planos from './telas/auth/cadastrar/planos.jsx'

import Header from './components/header/headerHome.jsx'
import HeaderLog from './components/header/headerLog.jsx'
import Footer from './components/footer/footer.jsx'

function App() {
  const [telaAtual, setTelaAtual] = useState('inicio')
  const [menuAberto, setMenuAberto] = useState(false)
  const [selecionadoPlanId, setSelecionadoPlanId] = useState(null);
  const [pagPlanId, setPagPlanId] = useState(null);
  const [empresaTemp, setEmpresaTemp] = useState(null);


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
    if (!selecionadoPlanId) {
      setTelaAtual('planos');
      return;
    }

    setPagPlanId(selecionadoPlanId);
    setTelaAtual('cad-empresa');
    window.scrollTo(0, 0);
  };

  const continueRegistration = () => {
    if (!pagPlanId) return;
    setTelaAtual('cad-empresa');
    window.scrollTo(0, 0);
  };

  const cadastrarEmpresaEAdministrador = async (empresa, administrador) => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${apiBase}/auth/register-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa, adm: administrador })
    });
    const resultado = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(resultado?.message || 'Não foi possível cadastrar a empresa e o administrador.');
    }

    return resultado;
  };

  return (
    <div>
      <header>
        {/* telas inicias */}
        {telaAtual === 'inicio' && <Header aoNavegar={setTelaAtual} />}
        {(telaAtual === 'login'|| telaAtual === 'planos') && (<HeaderLog aoNavegar={setTelaAtual} />)}

        {/* site */}
        {(telaAtual === 'cad-empresa' || telaAtual === 'cad-adm') && (
          <HeaderLog
            aoNavegar={setTelaAtual}
            menuAberto={menuAberto}
            setMenuAberto={setMenuAberto}
          />
        )}
      </header>

      <main className="conteudo">
        {telaAtual === 'inicio' && <Inicio aoNavegar={setTelaAtual} onChoosePlan={escolhaPlano} />}
        {telaAtual === 'planos' && <Planos aoNavegar={setTelaAtual} onChoosePlan={escolhaPlano} />}
        {telaAtual === 'login' && <Login aoNavegar={setTelaAtual} />}
        {telaAtual === 'cad-empresa' && (
          <CadEmpresa
            onNavigate={gerenciarNavegacao}
            showToast={message => window.alert(message)}
            onSaveTempEmpresa={setEmpresaTemp}
          />
        )}
        {telaAtual === 'cad-adm' && pagPlanId === selecionadoPlanId && empresaTemp && (
          <CadAdm
            onNavigate={gerenciarNavegacao}
            showToast={message => window.alert(message)}
            tempEmpresa={empresaTemp}
            onRegisterCompany={cadastrarEmpresaEAdministrador}
          />
        )}

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
        {(telaAtual === 'cad-empresa' || telaAtual === 'cad-adm') && (
          <Footer aoNavegar={setTelaAtual} />
        )}
      </footer>
    </div>
  )
}

export default App