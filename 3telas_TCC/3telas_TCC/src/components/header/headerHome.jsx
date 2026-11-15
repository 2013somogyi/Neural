import './header.css'

function Header({ aoNavegar }) {
    return (
        <header className="inicioHeader">
            <div className="inicioHeaderConteudo">
                <div className="inicioAreaLogo">
                    <div className="Logo" onClick={() => aoNavegar('inicio')}>
                        N
                    </div>
                    <span onClick={() => aoNavegar('inicio')}>Neural</span>
                </div>
                <nav className="inicioBotoesMeio">
                    <a href="#recursos">Recursos</a>
                    <a href="#planos">Planos</a>
                    <a href="#contato">Contato</a>
                </nav>
                <div className="inicioBotoesTopo">
                    <button className="btnLogin" onClick={() => aoNavegar('login')}>Entrar</button>
                    <button className="btnSignup" onClick={() => aoNavegar('planos')}>Cadastrar</button>
                </div>
            </div>
        </header>
    )
}

export default Header