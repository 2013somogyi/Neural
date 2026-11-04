import React, { useState } from 'react';
import { isValidCNPJ, isValidBrazilianPhone, isValidEmail, maskBrazilianDocument, maskBrazilianPhone } from '../utils/validation';

export function CadEmpresaView({ onNavigate, showToast, onSaveTempEmpresa }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!isValidCNPJ(empresa.cnpj)) nextErrors.cnpj = 'Informe um CNPJ válido.';
    if (!isValidBrazilianPhone(empresa.telefone)) nextErrors.telefone = 'Informe um telefone com DDD válido.';
    if (!isValidEmail(empresa.email)) nextErrors.email = 'Informe um e-mail válido.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSaveTempEmpresa(empresa);
    onNavigate('cad-adm');
  };

  return (
    <section className="flex-grow p-6 bg-slate-100 flex items-center justify-center min-h-screen">
      <div className="bg-dorfic-card w-full max-w-2xl p-8">
        <div className="flex items-center justify-between border-b border-orange-100 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dados da empresa:</h2>
            <p className="text-xs text-slate-500">Informe os dados da sua empresa para começar.</p>
          </div>
          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 font-bold rounded-full">Passo 1 de 2</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Jurídico:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="organization"
              placeholder="Digite o nome jurídico"
              value={empresa.nome_juridico}
              onChange={e => handleChange('nome_juridico', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="empresa-cnpj" className="block text-xs font-bold text-slate-700 mb-1">CNPJ:</label>
            <input
              id="empresa-cnpj"
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              value={empresa.cnpj}
              aria-invalid={Boolean(errors.cnpj)}
              aria-describedby={errors.cnpj ? 'empresa-cnpj-error' : undefined}
              onInput={e => {
                handleChange('cnpj', maskBrazilianDocument(e.currentTarget.value));
                if (errors.cnpj) setErrors(prev => ({ ...prev, cnpj: '' }));
              }}
            />
            {errors.cnpj && <p className="field-error" id="empresa-cnpj-error">{errors.cnpj}</p>}
          </div>
          <div>
            <label htmlFor="empresa-telefone" className="block text-xs font-bold text-slate-700 mb-1">Telefone:</label>
            <input
              id="empresa-telefone"
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={empresa.telefone}
              aria-invalid={Boolean(errors.telefone)}
              aria-describedby={errors.telefone ? 'empresa-telefone-error' : undefined}
              onInput={e => {
                handleChange('telefone', maskBrazilianPhone(e.currentTarget.value));
                if (errors.telefone) setErrors(prev => ({ ...prev, telefone: '' }));
              }}
            />
            {errors.telefone && <p className="field-error" id="empresa-telefone-error">{errors.telefone}</p>}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="empresa-email" className="block text-xs font-bold text-slate-700 mb-1">E-mail:</label>
            <input
              id="empresa-email"
              type="email"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="email"
              placeholder="Digite o e-mail corporativo"
              value={empresa.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'empresa-email-error' : undefined}
              onInput={e => {
                handleChange('email', e.currentTarget.value.trim());
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
            />
            {errors.email && <p className="field-error" id="empresa-email-error">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="address-line1"
              placeholder="Digite o logradouro"
              value={empresa.logradouro}
              onChange={e => handleChange('logradouro', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Número:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="address-line2"
              placeholder="Número"
              value={empresa.numero}
              onChange={e => handleChange('numero', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Complemento:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              autoComplete="address-line2"
              placeholder="Complemento (opcional)"
              value={empresa.complemento}
              onChange={e => handleChange('complemento', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bairro:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="address-level3"
              placeholder="Digite o bairro"
              value={empresa.bairro}
              onChange={e => handleChange('bairro', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cidade:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              autoComplete="address-level2"
              placeholder="Digite a cidade"
              value={empresa.cidade}
              onChange={e => handleChange('cidade', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estado (UF):</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-dorfic w-1/3 text-sm"
                required
                value={empresa.uf}
                maxLength="2"
                autoComplete="address-level1"
                placeholder="UF"
                onChange={e => handleChange('uf', e.target.value)}
              />
              <input
                type="text"
                className="input-dorfic w-2/3 text-sm"
                required
                autoComplete="postal-code"
                placeholder="CEP"
                value={empresa.cep}
                onBlur={lookupCep}
                onChange={e => handleChange('cep', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Funcionamento:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              placeholder="Ex.: segunda a sexta, das 8h às 18h"
              autoComplete="off"
              value={empresa.horario_funcionamento}
              onChange={e => handleChange('horario_funcionamento', e.target.value)}
            />
          </div>
          {cepLoading && <p className="md:col-span-2 text-xs text-slate-500">Consultando CEP...</p>}

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Modelo de operação:</label>
            <select
              className="input-dorfic w-full text-sm"
              value={empresa.modelo_estoque}
              onChange={e => handleChange('modelo_estoque', e.target.value)}
            >
              <option value="Com Estoque">Com controle de estoque</option>
              <option value="Sem Estoque">Sem controle de estoque</option>
            </select>
            <p className="mt-2 text-xs text-slate-600">
              {empresa.modelo_estoque === 'Com Estoque'
                ? 'As peças são controladas no catálogo e as saídas são registradas nas ordens.'
                : 'Peças podem ser descritas diretamente na ordem, sem controle de saldo.'}
            </p>
          </div>

          <div className="md:col-span-2 pt-4 flex justify-between">
            <button type="button" onClick={() => onNavigate('checkout')} className="btn-dorfic-secondary px-6 py-2.5">
              Voltar ao pagamento
            </button>
            <button type="submit" className="btn-dorfic px-8 py-2.5">
              Concluir & Próximo
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
