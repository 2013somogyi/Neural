import './cadastro.css'
import { useState } from 'react';
import {
  isValidCNPJ,
  isValidBrazilianPhone,
  isValidEmail,
  maskBrazilianDocument,
  maskBrazilianPhone
} from '../../../utils/validation';

export function CadEmpresa({ onNavigate, showToast, onSaveTempEmpresa }) {
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [empresa, setEmpresaState] = useState({
    nome_juridico: '',
    cnpj: '',
    telefone: '',
    email: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    horario_funcionamento: '',
    modelo_estoque: 'Com Estoque'
  });

  const handleChange = (field, value) => {
    setEmpresaState(prev => ({ ...prev, [field]: value }));
  };

  const lookupCep = async () => {
    const cep = empresa.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error('Não foi possível consultar o CEP.');

      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado.');

      setEmpresaState(prev => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        uf: data.uf || prev.uf
      }));
    } catch (error) {
      showToast(error.message || 'Falha ao consultar o CEP.', 'error');
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = evento => {
    evento.preventDefault();

    const nextErrors = {};

    if (!isValidCNPJ(empresa.cnpj)) {
      nextErrors.cnpj = 'Informe um CNPJ válido.';
    }

    if (!isValidBrazilianPhone(empresa.telefone)) {
      nextErrors.telefone = 'Informe um telefone com DDD válido.';
    }

    if (!isValidEmail(empresa.email)) {
      nextErrors.email = 'Informe um e-mail válido.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    onSaveTempEmpresa(empresa);
    onNavigate('cad-adm');
  };

  return (
    <section className="cadastro-empresa">
      <div className="cadastro-cartao">
        <div className="cadastro-cabecalho">
          <div>
            <h2 className="cadastro-titulo">Dados da empresa:</h2>
            <p className="cadastro-subtitulo">
              Informe os dados da sua empresa para começar.
            </p>
          </div>
          <span className="cadastro-etapa">Passo 1 de 2</span>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-formulario">
          <div className="campo campo-largo">
            <label className="campo-rotulo">Nome Jurídico:</label>
            <input
              type="text"
              className="campo-entrada"
              required
              autoComplete="organization"
              placeholder="Digite o nome jurídico"
              value={empresa.nome_juridico}
              onChange={evento =>
                handleChange('nome_juridico', evento.target.value)
              }
            />
          </div>

          <div className="campo">
            <label htmlFor="empresa-cnpj" className="campo-rotulo">
              CNPJ:
            </label>
            <input
              id="empresa-cnpj"
              type="text"
              className="campo-entrada"
              required
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              value={empresa.cnpj}
              aria-invalid={Boolean(errors.cnpj)}
              aria-describedby={
                errors.cnpj ? 'empresa-cnpj-error' : undefined
              }
              onInput={evento => {
                handleChange(
                  'cnpj',
                  maskBrazilianDocument(evento.currentTarget.value)
                );
                if (errors.cnpj) {
                  setErrors(prev => ({ ...prev, cnpj: '' }));
                }
              }}
            />
            {errors.cnpj && (
              <p className="campo-erro" id="empresa-cnpj-error">
                {errors.cnpj}
              </p>
            )}
          </div>

          <div className="campo">
            <label htmlFor="empresa-telefone" className="campo-rotulo">
              Telefone:
            </label>
            <input
              id="empresa-telefone"
              type="text"
              className="campo-entrada"
              required
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={empresa.telefone}
              aria-invalid={Boolean(errors.telefone)}
              aria-describedby={
                errors.telefone ? 'empresa-telefone-error' : undefined
              }
              onInput={evento => {
                handleChange(
                  'telefone',
                  maskBrazilianPhone(evento.currentTarget.value)
                );
                if (errors.telefone) {
                  setErrors(prev => ({ ...prev, telefone: '' }));
                }
              }}
            />
            {errors.telefone && (
              <p className="campo-erro" id="empresa-telefone-error">
                {errors.telefone}
              </p>
            )}
          </div>

          <div className="campo campo-largo">
            <label htmlFor="empresa-email" className="campo-rotulo">
              E-mail:
            </label>
            <input
              id="empresa-email"
              type="email"
              className="campo-entrada"
              required
              autoComplete="email"
              placeholder="Digite o e-mail corporativo"
              value={empresa.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? 'empresa-email-error' : undefined
              }
              onInput={evento => {
                handleChange('email', evento.currentTarget.value.trim());
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
            />
            {errors.email && (
              <p className="campo-erro" id="empresa-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="campo">
            <label className="campo-rotulo">Logradouro:</label>
            <input
              type="text"
              className="campo-entrada"
              required
              autoComplete="address-line1"
              placeholder="Digite o logradouro"
              value={empresa.logradouro}
              onChange={evento =>
                handleChange('logradouro', evento.target.value)
              }
            />
          </div>

          <div className="campo">
            <label className="campo-rotulo">Número:</label>
            <input
              type="text"
              className="campo-entrada"
              required
              autoComplete="address-line2"
              placeholder="Número"
              value={empresa.numero}
              onChange={evento => handleChange('numero', evento.target.value)}
            />
          </div>

          <div className="campo">
            <label className="campo-rotulo">Complemento:</label>
            <input
              type="text"
              className="campo-entrada"
              autoComplete="address-line2"
              placeholder="Complemento (opcional)"
              value={empresa.complemento}
              onChange={evento =>
                handleChange('complemento', evento.target.value)
              }
            />
          </div>

          <div className="campo">
            <label className="campo-rotulo">Bairro:</label>
            <input
              type="text"
              className="campo-entrada"
              required
              autoComplete="address-level3"
              placeholder="Digite o bairro"
              value={empresa.bairro}
              onChange={evento => handleChange('bairro', evento.target.value)}
            />
          </div>

          <div className="campo">
            <label className="campo-rotulo">Cidade:</label>
            <input
              type="text"
              className="campo-entrada"
              required
              autoComplete="address-level2"
              placeholder="Digite a cidade"
              value={empresa.cidade}
              onChange={evento => handleChange('cidade', evento.target.value)}
            />
          </div>

          <div className="campo">
            <label className="campo-rotulo">Estado (UF):</label>
            <div className="endereco-linha">
              <input
                type="text"
                className="campo-entrada campo-uf"
                required
                value={empresa.uf}
                maxLength="2"
                autoComplete="address-level1"
                placeholder="UF"
                onChange={evento => handleChange('uf', evento.target.value)}
              />
              <input
                type="text"
                className="campo-entrada campo-cep"
                required
                autoComplete="postal-code"
                placeholder="CEP"
                value={empresa.cep}
                onBlur={lookupCep}
                onChange={evento => handleChange('cep', evento.target.value)}
              />
            </div>
          </div>

          <div className="campo">
            <label className="campo-rotulo">
              Horário de Funcionamento:
            </label>
            <input
              type="text"
              className="campo-entrada"
              placeholder="Ex.: segunda a sexta, das 8h às 18h"
              autoComplete="off"
              value={empresa.horario_funcionamento}
              onChange={evento =>
                handleChange('horario_funcionamento', evento.target.value)
              }
            />
          </div>

          {cepLoading && (
            <p className="campo-largo cep-carregando">
              Consultando CEP...
            </p>
          )}

          <div className="campo campo-largo">
            <label className="campo-rotulo">Modelo de operação:</label>
            <select
              className="campo-entrada"
              value={empresa.modelo_estoque}
              onChange={evento =>
                handleChange('modelo_estoque', evento.target.value)
              }
            >
              <option value="Com Estoque">Com controle de estoque</option>
              <option value="Sem Estoque">Sem controle de estoque</option>
            </select>
            <p className="modelo-descricao">
              {empresa.modelo_estoque === 'Com Estoque'
                ? 'As peças são controladas no catálogo e as saídas são registradas nas ordens.'
                : 'Peças podem ser descritas diretamente na ordem, sem controle de saldo.'}
            </p>
          </div>

          <div className="campo-largo formulario-acoes">
            <button
              type="button"
              onClick={() => onNavigate('pagamento')}
              className="botao-voltar"
            >
              Voltar ao pagamento
            </button>
            <button type="submit" className="botao-proximo">
              Concluir & Próximo
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}