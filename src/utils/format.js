// Formatação de valores no padrão brasileiro.

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatCurrency = (value) => brl.format(Number(value) || 0);

export const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' no fuso local. */
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' -> Date local (meia-noite). */
export const parseISODate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISODate(new Date());

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const formatDate = (iso, opts = {}) =>
  iso ? parseISODate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', ...opts }) : '—';

export const formatDateLong = (iso) =>
  iso ? parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : '—';

export const formatWeekday = (iso) => parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long' });

export const formatDateTime = (isoString) =>
  isoString
    ? new Date(isoString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatDuration = (minutes) => {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h}h${pad(r)}` : `${h}h`;
};

export const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Retorna 'YYYY-MM' de uma data ISO. */
export const monthKey = (iso) => iso.slice(0, 7);

export const monthRange = (year, monthIndex) => {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export const firstName = (name = '') => name.split(' ')[0];

/** Normaliza texto para busca sem acentos e sem diferenciar maiúsculas. */
export const normalize = (text = '') =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
