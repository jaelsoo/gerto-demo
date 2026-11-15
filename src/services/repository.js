/**
 * Repositório de dados (mock back-end).
 * Concentra validações de negócio e gravação. As telas nunca acessam o armazenamento diretamente:
 * usam o DataContext, que chama estas funções. Uma futura API REST substituiria este módulo
 * mantendo as mesmas assinaturas.
 */
import { storage } from './storage';
import { buildSeed, SEED_VERSION } from '../data/seed';
import { conflictMessageParams, findConflicts, freeResources, isPast, renderTemplate, templateVariables } from '../utils/rules';
import { isValidCNH, isValidPlate, plateKey } from '../utils/masks';
import { uid } from '../utils/crypto';

const DB_KEY = 'db';
export const DB_STORAGE_KEY = DB_KEY;

/** Erro de regra de negócio associado a uma mensagem oficial do sistema. */
export class ApiError extends Error {
  constructor(code, params = {}, extra = {}) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.params = params;
    Object.assign(this, extra);
  }
}

export function loadDb() {
  let db = storage.read(DB_KEY);
  if (!db || db.version !== SEED_VERSION) {
    db = buildSeed();
    storage.write(DB_KEY, db);
  }
  return db;
}

/** Aplica uma mutação sobre uma cópia do banco e persiste o resultado. */
function commit(mutator) {
  const draft = structuredClone(loadDb());
  const result = mutator(draft);
  draft.updatedAt = new Date().toISOString();
  storage.write(DB_KEY, draft);
  return result;
}

const now = () => new Date().toISOString();
const requireFields = (data, fields) => {
  const missing = fields.filter((f) => data[f] === undefined || data[f] === null || String(data[f]).trim() === '');
  if (missing.length) throw new ApiError('MSG12', {}, { fields: missing });
};
const upsert = (list, item) => {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...item };
  else list.push(item);
  return idx >= 0;
};
const setActive = (collection) => (id, active) =>
  commit((db) => {
    const item = db[collection].find((x) => x.id === id);
    if (item) item.active = active;
    return item;
  });

export const repository = {
  load: loadDb,

  reset() {
    const db = buildSeed();
    storage.write(DB_KEY, db);
    return db;
  },

  /* ---------------- Usuários (UC01 — CA 1) ---------------- */
  updatePassword(email, password) {
    return commit((db) => {
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user) user.password = password;
      return user;
    });
  },

  /* ---------------- Frota (UC02) ---------------- */
  saveVehicle(data) {
    requireFields(data, ['brand', 'model', 'plate', 'year', 'category', 'ownership']);
    if (data.ownership === 'terceirizada') requireFields(data, ['ownerName']);
    if (!isValidPlate(data.plate)) throw new ApiError('MSG12', {}, { fields: ['plate'] });
    return commit((db) => {
      const dup = db.vehicles.find((v) => v.id !== data.id && plateKey(v.plate) === plateKey(data.plate));
      if (dup) throw new ApiError('MSG13', {}, { fields: ['plate'] });
      const item = { active: true, ...data, id: data.id || uid('v'), year: Number(data.year), seats: Number(data.seats) || 4 };
      const updated = upsert(db.vehicles, item);
      return { item, updated };
    });
  },
  setVehicleActive: setActive('vehicles'),

  saveDriver(data) {
    requireFields(data, ['name', 'cpf', 'cnh', 'cnhCategory', 'cnhExpiry', 'phone', 'bond']);
    if (!isValidCNH(data.cnh)) throw new ApiError('MSG12', {}, { fields: ['cnh'] });
    return commit((db) => {
      const dup = db.drivers.find((d) => d.id !== data.id && d.cnh === data.cnh);
      if (dup) throw new ApiError('MSG13', {}, { fields: ['cnh'] });
      const item = { active: true, ...data, id: data.id || uid('d') };
      const updated = upsert(db.drivers, item);
      return { item, updated };
    });
  },
  setDriverActive: setActive('drivers'),

  saveInterpreter(data) {
    requireFields(data, ['name', 'languages', 'phone']);
    return commit((db) => {
      const item = { active: true, ...data, id: data.id || uid('i'), dailyRate: Number(data.dailyRate) || 0 };
      const updated = upsert(db.interpreters, item);
      return { item, updated };
    });
  },
  setInterpreterActive: setActive('interpreters'),

  saveClient(data) {
    requireFields(data, ['name', 'type', 'document', 'phone']);
    return commit((db) => {
      const item = { active: true, vip: false, ...data, id: data.id || uid('c') };
      const updated = upsert(db.clients, item);
      return { item, updated };
    });
  },
  setClientActive: setActive('clients'),

  /* ---------------- Serviços (UC03 + UC05) ---------------- */
  saveService(data, actor) {
    requireFields(data, ['clientId', 'date', 'time', 'durationMin', 'origin', 'destination', 'value', 'vehicleId', 'driverId']);
    return commit((db) => {
      const existing = data.id ? db.services.find((s) => s.id === data.id) : null;
      if (data.id && !existing) throw new ApiError('MSG23');
      const scheduleChanged = !existing || existing.date !== data.date || existing.time !== data.time;
      // FE 3.1 — data e hora retroativas
      if (scheduleChanged && isPast(data.date, data.time)) throw new ApiError('MSG17', {}, { fields: ['date', 'time'] });

      const candidate = { ...existing, ...data, status: existing?.status || 'Agendado' };
      // UC05 — verificação de choque de frota/motorista (somente para serviços que ocupam recursos)
      if (['Agendado', 'Em Andamento'].includes(candidate.status)) {
        const conflicts = findConflicts(candidate, db);
        if (conflicts.length) {
          throw new ApiError('MSG20', conflictMessageParams(conflicts[0]), {
            conflicts,
            free: freeResources(candidate, db),
          });
        }
      }

      const clean = {
        ...data,
        durationMin: Number(data.durationMin),
        value: Number(data.value),
        passengers: Number(data.passengers) || 1,
        interpreterId: data.interpreterId || null,
        tags: data.tags || [],
      };

      if (existing) {
        const changed = ['date', 'time', 'durationMin', 'origin', 'destination', 'value', 'vehicleId', 'driverId', 'interpreterId', 'clientId']
          .filter((k) => String(existing[k] ?? '') !== String(clean[k] ?? ''));
        Object.assign(existing, clean, { updatedAt: now() });
        existing.logs.push({ at: now(), user: actor, action: changed.length ? `Ficha editada (${changed.join(', ')}).` : 'Ficha revisada sem alterações de itinerário.' });
        return { item: existing, updated: true };
      }
      const id = Math.max(1000, ...db.services.map((s) => s.id)) + 1;
      const item = { ...clean, id, status: 'Agendado', createdAt: now(), updatedAt: now(), logs: [{ at: now(), user: actor, action: 'Serviço criado com status "Agendado".' }] };
      db.services.push(item);
      return { item, updated: false };
    });
  },

  updateServiceStatus(id, status, actor) {
    return commit((db) => {
      const s = db.services.find((x) => x.id === id);
      if (!s) throw new ApiError('MSG23');
      const previous = s.status;
      s.status = status;
      s.updatedAt = now();
      s.logs.push({ at: now(), user: actor, action: `Status alterado de "${previous}" para "${status}".` });
      return s;
    });
  },

  /* ---------------- Finanças (UC10) ---------------- */
  saveTransaction(data, actor) {
    requireFields(data, ['type', 'category', 'amount', 'date']);
    if (!(Number(data.amount) > 0)) throw new ApiError('MSG12', {}, { fields: ['amount'] });
    return commit((db) => {
      const item = { active: true, createdBy: actor, ...data, id: data.id || uid('t'), amount: Number(data.amount) };
      const updated = upsert(db.transactions, item);
      return { item, updated };
    });
  },
  setTransactionActive: setActive('transactions'),

  /* ---------------- Documentos fiscais (UC15) ---------------- */
  issueFiscalDoc(serviceId, type) {
    return commit((db) => {
      const s = db.services.find((x) => x.id === serviceId);
      if (!s) throw new ApiError('MSG23');
      const seq = db.fiscalDocs.length + 1;
      const item = {
        id: uid('f'),
        serviceId,
        type,
        number: `${type === 'NFS-e' ? 'NFS' : 'REC'}-${new Date().getFullYear()}${String(seq).padStart(3, '0')}`,
        amount: s.value,
        issueDate: new Date().toISOString().slice(0, 10),
        status: 'Emitida',
      };
      db.fiscalDocs.push(item);
      return item;
    });
  },

  /* ---------------- Templates (UC13) ---------------- */
  saveTemplate(data) {
    requireFields(data, ['title', 'body']);
    return commit((db) => {
      const item = { active: true, category: 'Contrato', ...data, id: data.id || uid('tp'), updatedAt: now() };
      const updated = upsert(db.templates, item);
      return { item, updated };
    });
  },
  setTemplateActive: setActive('templates'),

  /* ---------------- Contratos (UC13 CA 3.2 + UC14) ---------------- */
  createContract(serviceId, templateId, actor) {
    return commit((db) => {
      const service = db.services.find((s) => s.id === serviceId);
      const tpl = db.templates.find((t) => t.id === templateId && t.active);
      if (!service) throw new ApiError('MSG23');
      if (!tpl) throw new ApiError('MSG45');
      const n = db.contracts.length + 1;
      const item = {
        id: uid('ct'),
        number: `CT-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`,
        serviceId,
        templateId,
        title: tpl.title,
        content: renderTemplate(tpl.body, templateVariables(service, db)),
        status: 'Pendente',
        createdAt: now(),
        history: [{ at: now(), status: 'Pendente', user: actor, note: 'Contrato gerado a partir do template.' }],
        attachments: [],
        signature: null,
      };
      db.contracts.push(item);
      return item;
    });
  },

  updateContractStatus(id, status, actor, note = '') {
    return commit((db) => {
      const c = db.contracts.find((x) => x.id === id);
      if (!c) throw new ApiError('MSG47');
      c.status = status;
      c.history.push({ at: now(), status, user: actor, note });
      return c;
    });
  },

  signContract(id, signature, actor) {
    return commit((db) => {
      const c = db.contracts.find((x) => x.id === id);
      if (!c) throw new ApiError('MSG47');
      c.signature = signature;
      c.status = 'Assinado';
      c.history.push({ at: signature.at, status: 'Assinado', user: actor, note: `Assinatura eletrônica registrada (hash ${signature.hash.slice(0, 12)}…).` });
      return c;
    });
  },

  addContractAttachment(id, attachment, actor) {
    return commit((db) => {
      const c = db.contracts.find((x) => x.id === id);
      if (!c) throw new ApiError('MSG47');
      c.attachments.push({ id: uid('a'), addedAt: now(), addedBy: actor, ...attachment });
      return c;
    });
  },
};
