const { digitsOnly } = require('./validation');

function normalizeBrazilianPhone(value) {
  let phone = digitsOnly(value);
  if (phone.startsWith('55') && [12, 13].includes(phone.length)) {
    phone = phone.slice(2);
  }
  return [10, 11].includes(phone.length) ? phone : null;
}

module.exports = { normalizeBrazilianPhone };
