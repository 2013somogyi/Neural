const digitsOnly = value => String(value ?? '').replace(/\D/g, '');

export function maskBrazilianDocument(value) {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskBrazilianPhone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length < 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const subscriberLength = digits.length > 10 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 2 + subscriberLength)}-${digits.slice(2 + subscriberLength)}`;
}

export function maskCurrencyBRL(value) {
  const digits = digitsOnly(value).slice(0, 15);
  if (!digits) return '';
  const amount = Number(digits || 0) / 100;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrencyBRL(value) {
  const amount = Number(value);
  return (Number.isFinite(amount) ? amount : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function parseCurrencyBRL(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const digits = digitsOnly(value);
  return Number(digits || 0) / 100;
}

export function isValidCPF(value) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digitAt = length => {
    const sum = cpf.slice(0, length).split('').reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index),
      0
    );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digitAt(9) === Number(cpf[9]) && digitAt(10) === Number(cpf[10]);
}

export function isValidCNPJ(value) {
  const cnpj = digitsOnly(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digitAt = (base, weights) => {
    const sum = base.split('').reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = digitAt(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = digitAt(`${cnpj.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj.endsWith(`${first}${second}`);
}

export function isValidBrazilianDocument(value) {
  const digits = digitsOnly(value);
  return digits.length === 11 ? isValidCPF(digits) : digits.length === 14 && isValidCNPJ(digits);
}

export function isValidBrazilianPhone(value) {
  const digits = digitsOnly(value);
  return [10, 11].includes(digits.length) && !/^(\d)\1+$/.test(digits);
}

export function isValidEmail(value) {
  const email = String(value ?? '').trim();
  if (email.length > 254 || /\s/.test(email)) return false;
  const [local, domain, ...extra] = email.split('@');
  if (extra.length || !local || local.length > 64 || !domain || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split('.');
  return labels.length > 1 && labels.every(label =>
    label.length > 0
    && label.length <= 63
    && /^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label)
  ) && /^[A-Z]{2,}$/i.test(labels[labels.length - 1]);
}
