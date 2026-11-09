import './headerSite.css'

function HeaderSite({ aoNavegar, menuAberto, setMenuAberto }) {
    return (
        <header className="painelHeader">   
                <div className="headerEmpresa">
                    {/* Botão Hamburguer no canto superior esquerdo */}
                    <button 
                        className="btnHamburguer" 
                        onClick={() => setMenuAberto(!menuAberto)}
                        title="Abrir/Fechar menu lateral"
                    >
                        ☰
                    </button>

                    <div className="logoPainel">N</div>
                    <div className="infoEmpresa">
                        <div className="nomeEmpresa">Empresa: Neural Tech Soluções LTDA • Plano Prime</div>
                        <div className="nomeUsuario">Nome: Carlos Eduardo Silva (Administrador)</div>
                    </div>
                </div>

                <div className="headerAcoes">
                    <button className="btnInicio" onClick={() => aoNavegar('inicio')}>
                        ⌂ INÍCIO
                    </button>

                    <span className="headerLinks">⚙ Configuração | ❓ Suporte</span>
                    <span className="logoTextoNeural">N Neural</span>

                    <button className="btnSair" onClick={() => aoNavegar('inicio')}>
                        Sair
                    </button>
                </div>
            </header>
        )
    }
export default HeaderSite