function getOrderVisibilityFilter(user, alias = 'o') {
  if (user.perfil !== 'Tecnico') return { sql: '', values: [] };
  if (!user.id_tecnico) {
    return { sql: ` AND ${alias}.id_tecnico_responsavel IS NULL`, values: [] };
  }

  return {
    sql: ` AND (
      ${alias}.id_tecnico_responsavel IS NULL
      OR ${alias}.id_tecnico_responsavel = ?
    )`,
    values: [user.id_tecnico]
  };
}

module.exports = { getOrderVisibilityFilter };
