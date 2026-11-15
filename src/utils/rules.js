// Regras de negócio puras (sem acesso a armazenamento) — reutilizadas pela camada de dados e pelas telas.
import { ACTIVE_SERVICE_STATUS, OWNERSHIP } from '../constants/domain';
import { formatCurrency, formatDate, formatDuration, formatTime, formatWeekday, parseISODate, todayISO } from './format';

/* ------------------------------------------------------------------ */
/* Janelas de horário e choque de frota (UC05)                         */
/* ------------------------------------------------------------------ */

export const toDateTime = (date, time) => {
  const d = parseISODate(date);
  const [h, m] = (time || '00:00').split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

export function serviceWindow(service) {
  const start = toDateTime(service.date, service.time);
  const end = new Date(start.getTime() + (Number(service.durationMin) || 0) * 60000);
  return { start, end };
}

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/** Serviços ativos (Agendado / Em Andamento) que se sobrepõem à janela do candidato. */
function overlapping(candidate, services) {
  const win = serviceWindow(candidate);
  return services.filter(
    (s) => s.id !== candidate.id && ACTIVE_SERVICE_STATUS.includes(s.status) && overlaps(win, serviceWindow(s)),
  );
}

/**
 * Lista os conflitos de veículo e motorista para um serviço candidato.
 * Retorna objetos prontos para compor a [MSG20].
 */
export function findConflicts(candidate, db) {
  const conflicts = [];
  overlapping(candidate, db.services).forEach((s) => {
    const { start, end } = serviceWindow(s);
    if (candidate.vehicleId && s.vehicleId === candidate.vehicleId) {
      const v = db.vehicles.find((x) => x.id === s.vehicleId);
      conflicts.push({ kind: 'vehicle', service: s, label: v ? `${v.model} / ${v.plate}` : s.vehicleId, start, end });
    }
    if (candidate.driverId && s.driverId === candidate.driverId) {
      const d = db.drivers.find((x) => x.id === s.driverId);
      conflicts.push({ kind: 'driver', service: s, label: d ? d.name : s.driverId, start, end });
    }
  });
  return conflicts;
}

/** Parâmetros da [MSG20] a partir de um conflito. */
export const conflictMessageParams = (c) => ({
  'Modelo/Placa': c.label,
  ID: c.service.id,
  'Hora Início': formatTime(c.start),
  'Hora Fim': formatTime(c.end),
});

/** Veículos e motoristas ativos livres na janela do candidato (UC05 — CA 1.1). */
export function freeResources(candidate, db) {
  const busy = overlapping(candidate, db.services);
  const busyVehicles = new Set(busy.map((s) => s.vehicleId));
  const busyDrivers = new Set(busy.map((s) => s.driverId));
  return {
    vehicles: db.vehicles.filter((v) => v.active && !busyVehicles.has(v.id)),
    drivers: db.drivers.filter((d) => d.active && !busyDrivers.has(d.id)),
  };
}

export const isPast = (date, time) => toDateTime(date, time).getTime() < Date.now();

/* ------------------------------------------------------------------ */
/* Finanças por serviço (UC10)                                         */
/* ------------------------------------------------------------------ */

export const activeTransactions = (transactions) => transactions.filter((t) => t.active !== false);

export function summarize(transactions) {
  const revenue = transactions.filter((t) => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter((t) => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
  const net = revenue - expenses;
  return { revenue, expenses, net, margin: revenue > 0 ? (net / revenue) * 100 : null, count: transactions.length };
}

export const serviceTransactions = (serviceId, db) =>
  activeTransactions(db.transactions).filter((t) => t.serviceId === serviceId);

export const serviceFinance = (serviceId, db) => summarize(serviceTransactions(serviceId, db));

export const transactionsInRange = (db, start, end) =>
  activeTransactions(db.transactions).filter((t) => t.date >= start && t.date <= end);

export function groupByCategory(transactions) {
  const map = new Map();
  transactions.forEach((t) => {
    const key = `${t.type}|${t.category}`;
    const cur = map.get(key) || { type: t.type, category: t.category, total: 0, count: 0 };
    cur.total += Number(t.amount);
    cur.count += 1;
    map.set(key, cur);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/* ------------------------------------------------------------------ */
/* Etiquetas (UC06)                                                    */
/* ------------------------------------------------------------------ */

export function serviceTags(service, db) {
  const tags = [service.status];
  const vehicle = db.vehicles.find((v) => v.id === service.vehicleId);
  if (vehicle) tags.push(OWNERSHIP[vehicle.ownership]);
  const client = db.clients.find((c) => c.id === service.clientId);
  if (client?.vip) tags.push('VIP');
  if (client?.discreet) tags.push('Sigilo');
  if (service.interpreterId) tags.push('Bilíngue');
  (service.tags || []).forEach((t) => !tags.includes(t) && tags.push(t));
  return tags;
}

export function vehicleTags(vehicle) {
  const tags = [OWNERSHIP[vehicle.ownership], vehicle.category];
  if (!vehicle.active) tags.push('Inativo');
  return tags;
}

/** Filtro combinado: o item precisa conter TODAS as etiquetas selecionadas. */
export const matchesAllTags = (itemTags, selected) => selected.every((t) => itemTags.includes(t));

/* ------------------------------------------------------------------ */
/* Resumo para WhatsApp (UC07)                                         */
/* ------------------------------------------------------------------ */

/**
 * Opções:
 * - includeValue: inclui o valor do serviço;
 * - discreet: oculta nome do cliente e do passageiro (clientes que exigem sigilo — persona "Deputado Roberto");
 * - coordinator: { name, phone } de quem coordena o serviço (persona "Junior" quer comunicação direta).
 */
export function buildServiceSummary(service, db, { includeValue = false, discreet = false, coordinator = null } = {}) {
  if (!service) throw new Error('Serviço inexistente');
  const client = db.clients.find((c) => c.id === service.clientId);
  const vehicle = db.vehicles.find((v) => v.id === service.vehicleId);
  const driver = db.drivers.find((d) => d.id === service.driverId);
  const interpreter = db.interpreters.find((i) => i.id === service.interpreterId);
  const { end } = serviceWindow(service);

  const lines = [
    `*ROAS Transfer — Serviço nº ${service.id}*`,
    '',
    `📅 *Data:* ${formatDate(service.date)} (${formatWeekday(service.date)})`,
    `⏰ *Horário:* ${service.time} às ${formatTime(end)} (duração estimada ${formatDuration(service.durationMin)})`,
    `👤 *Cliente:* ${discreet ? 'Reservado (atendimento sigiloso)' : client?.name || '—'}`,
  ];
  if (service.passengerName && !discreet) lines.push(`🧳 *Passageiro(s):* ${service.passengerName}${service.passengers ? ` — ${service.passengers} pax` : ''}`);
  if (service.flight) lines.push(`✈️ *Voo:* ${service.flight}`);
  lines.push('', `📍 *Origem:* ${service.origin}`, `🏁 *Destino:* ${service.destination}`, '');
  lines.push(`🚘 *Veículo:* ${vehicle ? `${vehicle.brand} ${vehicle.model} — ${vehicle.color} — placa ${vehicle.plate}` : '—'}`);
  lines.push(`🧑‍✈️ *Motorista:* ${driver ? `${driver.name} — ${driver.phone}` : '—'}`);
  if (interpreter) lines.push(`🗣️ *Intérprete:* ${interpreter.name} (${interpreter.languages}) — ${interpreter.phone}`);
  if (includeValue) lines.push(`💰 *Valor:* ${formatCurrency(service.value)}`);
  if (service.notes) lines.push('', `📝 *Observações:* ${service.notes}`);
  if (coordinator?.name) lines.push('', `📞 *Coordenação ROAS:* ${coordinator.name}${coordinator.phone ? ` — ${coordinator.phone}` : ''}`);
  lines.push('', `Status: ${service.status}`, '_Mensagem gerada pelo Gerto._');
  return lines.join('\n');
}

export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

/* ------------------------------------------------------------------ */
/* Templates de contrato (UC13)                                        */
/* ------------------------------------------------------------------ */

export function templateVariables(service, db) {
  const client = db.clients.find((c) => c.id === service?.clientId);
  const vehicle = db.vehicles.find((v) => v.id === service?.vehicleId);
  const driver = db.drivers.find((d) => d.id === service?.driverId);
  return {
    cliente: client?.name || '',
    documento_cliente: client?.document || '',
    data: service ? formatDate(service.date) : '',
    horario: service?.time || '',
    origem: service?.origin || '',
    destino: service?.destination || '',
    valor: service ? formatCurrency(service.value) : '',
    veiculo: vehicle ? `${vehicle.brand} ${vehicle.model} (placa ${vehicle.plate})` : '',
    motorista: driver?.name || '',
    servico: service ? String(service.id) : '',
    data_emissao: formatDate(todayISO()),
  };
}

export function renderTemplate(body, variables) {
  return String(body).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match,
  );
}

export const extractVariables = (body = '') => [...new Set([...String(body).matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) => m[1]))];
