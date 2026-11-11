import { useState } from 'react'
import './App.css'
import Inicio from './telas/inicio/inicio.jsx'
import Login from './telas/entrar/login.jsx'
import Cadastro from './telas/cadastrar/cadastro.jsx'

import Header from './components/header/headerHome.jsx'
import HeaderSite from './components/header/headerSite.jsx'
import HeaderLog from './components/header/headerLog.jsx'

import Footer from './components/footer/footer.jsx'

function App() {
  const [telaAtual, setTelaAtual] = useState('inicio')

  return (
    <div>
      {telaAtual === 'inicio' && <Header aoNavegar={setTelaAtual} />}
      {telaAtual === 'login' && <HeaderLog aoNavegar={setTelaAtual} />}
      {telaAtual === '' && <HeaderLog aoNavegar={setTelaAtual} />}

      <main className="conteudo">
        {telaAtual === 'inicio' && <Inicio aoNavegar={setTelaAtual} />}
        {telaAtual === 'login' && <Login aoNavegar={setTelaAtual} />}
        {telaAtual === 'cadastro' && <Cadastro aoNavegar={setTelaAtual} />}
      </main>
      <footer>
        {telaAtual === 'inicio' && <Footer aoNavegar={setTelaAtual} />}
        {telaAtual === 'login' && <Footer aoNavegar={setTelaAtual} />}
        {telaAtual === 'cadastro' && <Footer aoNavegar={setTelaAtual} />}
      </footer>
    </div>
  )
}

export default App