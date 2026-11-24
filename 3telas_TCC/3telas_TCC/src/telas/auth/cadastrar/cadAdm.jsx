import { useState } from 'react';
import './cadastro.css';

export function CadAdm({
  onNavigate: aoNavegar,
  showToast: mostrarAviso,
  tempEmpresa: empresaTemporaria,
  onRegisterCompany: cadastrarEmpresa
}) {
  const [carregando, definirCarregamento] = useState(false);
  const [dadosAdministrador, definirDadosAdministrador] = useState({
    nome: '',
    login: '',
    senha: ''
  });

  const alterarCampo = (campo, valor) => {
    definirDadosAdministrador(dadosAnteriores => ({
      ...dadosAnteriores,
      [campo]: valor
    }));
  };

  const enviarFormulario = async evento => {
    evento.preventDefault();
    definirCarregamento(true);

    try {
      await cadastrarEmpresa(empresaTemporaria, dadosAdministrador);
      mostrarAviso('Empresa e ADM cadastrados com sucesso!');
      aoNavegar('login');
    } catch (erro) {
      mostrarAviso(
        erro.message || 'Erro ao cadastrar empresa/ADM',
        'error'
      );
    } finally {
      definirCarregamento(false);
    }
  };

  return (
    <section className="cadastro-adm">
      <div className="adm-cartao">
        <header className="adm-cabecalho">
          <div className="adm-marca" aria-hidden="true">
            N
          </div>
          <h2 className="adm-titulo">Dados do ADM:</h2>
          <p className="adm-subtitulo">
            Cadastre o Administrador principal da Empresa
          </p>
        </header>

        <form onSubmit={enviarFormulario} className="adm-formulario">
          <div className="adm-campo">
            <label htmlFor="adm-nome" className="adm-rotulo">
              Nome Completo:
            </label>
            <input
              id="adm-nome"
              type="text"
              className="adm-entrada"
              required
              autoComplete="name"
              placeholder="Digite o nome completo"
              value={dadosAdministrador.nome}
              onChange={evento =>
                alterarCampo('nome', evento.target.value)
              }
            />
          </div>

          <div className="adm-campo">
            <label htmlFor="adm-login" className="adm-rotulo">
              Login:
            </label>
            <input
              id="adm-login"
              type="text"
              className="adm-entrada"
              required
              autoComplete="username"
              placeholder="Escolha um login"
              value={dadosAdministrador.login}
              onChange={evento =>
                alterarCampo('login', evento.target.value)
              }
            />
          </div>

          <div className="adm-campo">
            <label htmlFor="adm-senha" className="adm-rotulo">
              Senha:
            </label>
            <input
              id="adm-senha"
              type="password"
              className="adm-entrada"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              value={dadosAdministrador.senha}
              onChange={evento =>
                alterarCampo('senha', evento.target.value)
              }
            />
          </div>

          <div className="adm-acoes">
            <button
              type="button"
              onClick={() => aoNavegar('cad-empresa')}
              className="adm-botao-voltar"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="adm-botao-cadastrar"
            >
              {carregando ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}