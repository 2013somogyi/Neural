import './header.css'

function HeaderLog({ aoNavegar }) {
    return (
        <header className="inicioHeader">
            <div className="inicioHeaderConteudo">
                <div className="inicioAreaLogo">
                    <div onClick={() => aoNavegar('inicio')} className="Logo">N</div>
                    <span onClick={() => aoNavegar('inicio')}>Neural</span>
                </div>
                <div className="inicioBotoesTopo">
                    <button className="btnLogin" onClick={() => aoNavegar('inicio')}>⭠ Voltar para o início</button>
                </div>
            </div>
        </header>
    )
}

export default HeaderLog