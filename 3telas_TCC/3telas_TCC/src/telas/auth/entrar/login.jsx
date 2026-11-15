import './login.css'

function Login({ aoNavegar }) {
    function fazerLogin(event) {
        event.preventDefault() // Evita que a página recarregue ao enviar o formulário
        aoNavegar('cadastro')  // Leva para a tela de Ordem de Serviço!
    }

    return (
        <div className="loginPai">
            <div className="cardLogin">
                
                {/* Logo */}
                <div className="logoLogin">
                    <div className="Logo">N</div>
                    <span>Neural</span>
                </div>

                <h2 className="tituloLogin">Acessar a Plataforma</h2>
                <p className="subtituloLogin">Digite suas credenciais N Neural</p>

                {/* Formulário */}
                <form onSubmit={fazerLogin}>
                    <div className="campo">
                        <label>Login:</label>
                        <input type="text" defaultValue="admin" placeholder="Seu usuário ou e-mail" required />
                    </div>

                    <div className="campo">
                        <label>Senha:</label>
                        <input type="password" defaultValue="123456" placeholder="••••••••" required />
                    </div>

                    <a href="#" className="esqueciSenha" onClick={(e) => { e.preventDefault(); alert('Instruções enviadas para o e-mail cadastrado!'); }}>
                        Esqueci a senha
                    </a>

                    <div className="botoesLogin">
                        <button type="button" className="btnVoltar" onClick={() => aoNavegar('inicio')}>Voltar</button>
                        
                        <button type="submit" className="btnLogar">Logar</button>
                    </div>
                </form>

            </div>
        </div>
    )
}

export default Login