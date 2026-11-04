const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidCpf, isValidCnpj } = require('../src/utils/validation');
const { normalizeBrazilianPhone } = require('../src/utils/normalization');
const { toApiRole, toDatabaseRole } = require('../src/utils/roles');
const { getOrderVisibilityFilter } = require('../src/services/orderVisibility');
const { splitStatements } = require('../src/db/execute_migration');

test('valida documentos brasileiros sem consultar o banco', async t => {
  await t.test('aceita CPF e CNPJ com dígitos verificadores válidos', () => {
    assert.equal(isValidCpf('529.982.247-25'), true);
    assert.equal(isValidCnpj('11.222.333/0001-81'), true);
  });

  await t.test('rejeita documentos inválidos e sequências repetidas', () => {
    assert.equal(isValidCpf('111.111.111-11'), false);
    assert.equal(isValidCnpj('00.000.000/0000-00'), false);
  });
});

test('normaliza telefones para o formato persistido no schema', () => {
  assert.equal(normalizeBrazilianPhone('(11) 98765-4321'), '11987654321');
  assert.equal(normalizeBrazilianPhone('+55 11 3456-7890'), '1134567890');
  assert.equal(normalizeBrazilianPhone('123'), null);
});

test('converte perfis do schema para os nomes usados pela API', () => {
  assert.equal(toApiRole('ADMIN'), 'Admin');
  assert.equal(toApiRole('TECNICO'), 'Tecnico');
  assert.equal(toDatabaseRole('Admin'), 'ADMIN');
  assert.equal(toDatabaseRole('Tecnico'), 'TECNICO');
});

test('separa os comandos SQL da migration sem quebrar valores com ponto e vírgula', () => {
  assert.deepEqual(splitStatements([
    '-- comentário',
    'USE NEURAL;',
    "UPDATE empresas SET nome = 'Assistência; Técnica' WHERE nome_juridico IS NULL;",
    ''
  ].join('\n')), [
    'USE NEURAL',
    "UPDATE empresas SET nome = 'Assistência; Técnica' WHERE nome_juridico IS NULL"
  ]);
});

test('centraliza a visibilidade de OS por perfil', () => {
  assert.deepEqual(getOrderVisibilityFilter({ perfil: 'Admin' }), { sql: '', values: [] });
  assert.deepEqual(getOrderVisibilityFilter({ perfil: 'Financeiro' }), { sql: '', values: [] });
  assert.deepEqual(getOrderVisibilityFilter({ perfil: 'Tecnico', id_tecnico: 9 }), {
    sql: expectVisibilitySql(),
    values: [9]
  });
});

function expectVisibilitySql() {
  return ` AND (
      o.id_tecnico_responsavel IS NULL
      OR o.id_tecnico_responsavel = ?
    )`;
}
