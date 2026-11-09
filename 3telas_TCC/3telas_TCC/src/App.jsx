import { useState } from 'react'
import './App.css'
import Inicio from './telas/inicio/inicio.jsx'
import Login from './telas/entrar/login.jsx'
import Cadastro from './telas/cadastrar/cadastro.jsx'

import Header from './components/header/header.jsx'

function App() {
  const [telaAtual, setTelaAtual] = useState('inicio')

  return (
    <div>
      {telaAtual === 'inicio' && <Header aoNavegar={setTelaAtual} />}

      <main className="conteudo">
        {telaAtual === 'inicio' && <Inicio aoNavegar={setTelaAtual} />}
        {telaAtual === 'login' && <Login aoNavegar={setTelaAtual} />}
        {telaAtual === 'cadastro' && <Cadastro aoNavegar={setTelaAtual} />}
      </main>
    </div>
  )
}

export default App