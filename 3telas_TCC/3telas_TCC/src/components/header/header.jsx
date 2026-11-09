import './header.css'

function Header({ aoNavegar }) {
    return (
        <header className="inicioHeader">
            <div className="inicioHeaderConteudo">
                <div className="inicioAreaLogo">
                    <div className="Logo">N</div>
                    <span>Neural</span>
                </div>
                <div className="inicioBotoesTopo">
                    <button className="btnLogin" onClick={() => aoNavegar('login')}>Entrar</button>
                    <button className="btnSignup" onClick={() => aoNavegar('cadastro')}>Cadastrar</button>
                </div>
            </div>
        </header>
    )
}

export default Header