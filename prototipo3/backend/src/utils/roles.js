const databaseToApiRole = {
  ADMIN: 'Admin',
  GERENTE: 'Gerente',
  SUPERVISOR: 'Supervisor',
  FINANCEIRO: 'Financeiro',
  ATENDENTE: 'Atendente',
  TECNICO: 'Tecnico',
  SUPRIMENTOS: 'Suprimentos',
  ESTOQUISTA: 'Estoquista'
};

const apiToDatabaseRole = Object.fromEntries(
  Object.entries(databaseToApiRole).map(([databaseRole, apiRole]) => [apiRole, databaseRole])
);

function toApiRole(role) {
  return databaseToApiRole[role] || role;
}

function toDatabaseRole(role) {
  return apiToDatabaseRole[role] || role;
}

module.exports = { toApiRole, toDatabaseRole };
