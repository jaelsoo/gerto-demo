// Máscaras e validações de campos (UC02 — passo 4 do fluxo principal).

const onlyDigits = (v = '') => String(v).replace(/\D/g, '');

/**
 * Placa: aceita padrão Mercosul (ABC1D23) e o antigo (ABC-1234).
 * Mantém letras maiúsculas e aplica hífen apenas no padrão antigo.
 */
export function maskPlate(value = '') {
  const raw = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  const letters = raw.slice(0, 3).replace(/[^A-Z]/g, '');
  if (letters.length < 3) return letters;
  const rest = raw.slice(3);
  let out = letters;
  for (let i = 0; i < rest.length; i += 1) {
    const ch = rest[i];
    if (i === 1) out += ch; // 5º caractere: letra (Mercosul) ou número (antigo)
    else if (/\d/.test(ch)) out += ch;
  }
  // Padrão antigo (4 dígitos) recebe hífen para leitura.
  if (/^[A-Z]{3}\d{4}$/.test(out)) return `${out.slice(0, 3)}-${out.slice(3)}`;
  return out;
}

export const plateKey = (plate = '') => String(plate).toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isValidPlate = (plate = '') => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plateKey(plate));

export const isMercosulPlate = (plate = '') => /^[A-Z]{3}\d[A-Z]\d{2}$/.test(plateKey(plate));

export function maskCPF(value = '') {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCNPJ(value = '') {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** CPF ou CNPJ conforme a quantidade de dígitos. */
export const maskDocument = (value = '') => (onlyDigits(value).length > 11 ? maskCNPJ(value) : maskCPF(value));

export const maskCNH = (value = '') => onlyDigits(value).slice(0, 11);

export const isValidCNH = (value = '') => onlyDigits(value).length === 11;

export function maskPhone(value = '') {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());

/** Converte "1.234,56" ou "1234.56" em número. */
export function parseMoney(value) {
  if (typeof value === 'number') return value;
  const s = String(value || '').trim();
  if (!s) return NaN;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return Number(normalized);
}
