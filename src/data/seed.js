/**
 * Dados iniciais (seed) FICTÍCIOS da ROAS Transfer.
 * As datas são geradas relativas ao dia do primeiro acesso para que a demonstração
 * sempre tenha serviços passados, do dia e futuros. Nenhum dado pertence a pessoas ou empresas reais.
 */
import { addDays, toISODate } from '../utils/format';
import { renderTemplate, templateVariables } from '../utils/rules';
import { fnv1a } from '../utils/crypto';

export const SEED_VERSION = 7;

/**
 * Usuários administrativos baseados nas personas do planejamento (Design Thinking — seção 2.2):
 * Lucas (Chefe e motorista / CEO) e Jaellen (Coordenadora / Advogada / Administradora).
 */
const users = [
  { id: 'u1', name: 'Lucas', email: 'lucas@roastransfer.demo', password: 'Gerto@2026', role: 'Administrador', title: 'Chefe e Motorista (CEO)', phone: '(61) 99100-1010', active: true },
  { id: 'u2', name: 'Jaellen', email: 'jaellen@roastransfer.demo', password: 'Gerto@2026', role: 'Administrador', title: 'Coordenadora / Advogada / Administradora', phone: '(61) 99100-2020', active: true },
  { id: 'u3', name: 'Conta Desativada', email: 'inativo@roastransfer.demo', password: 'Gerto@2026', role: 'Administrador', title: 'Ex-colaborador', phone: '', active: false },
];

const clients = [
  { id: 'c1', name: 'Agrovale Exportações S.A.', type: 'Corporativo', document: '12.345.678/0001-90', contact: 'Juliana Prado', phone: '(61) 99812-4410', email: 'viagens@agrovale.demo', vip: true, active: true },
  { id: 'c2', name: 'Consórcio Planalto Engenharia', type: 'Corporativo', document: '23.456.789/0001-01', contact: 'Rafael Monteiro', phone: '(61) 99705-2231', email: 'adm@planaltoeng.demo', vip: false, active: true },
  { id: 'c3', name: 'Instituto Cerrado de Pesquisa', type: 'Corporativo', document: '34.567.890/0001-12', contact: 'Dra. Lívia Campos', phone: '(61) 99633-8015', email: 'eventos@icerrado.demo', vip: false, active: true },
  { id: 'c4', name: 'Altiplano Eventos & Congressos', type: 'Corporativo', document: '45.678.901/0001-23', contact: 'Bruno Teles', phone: '(61) 99550-1290', email: 'logistica@altiplano.demo', vip: false, active: true },
  { id: 'c5', name: 'Lumen Consultoria Jurídica', type: 'Corporativo', document: '56.789.012/0001-34', contact: 'Carla Nunes', phone: '(61) 99418-7744', email: 'secretaria@lumen.demo', vip: true, active: true },
  { id: 'c6', name: 'Helena Duarte', type: 'Pessoa Física', document: '123.456.789-00', contact: 'Helena Duarte', phone: '(61) 99377-6602', email: 'helena.duarte@email.demo', vip: true, active: true },
  { id: 'c7', name: 'Thomas Berger', type: 'Pessoa Física', document: '987.654.321-00', contact: 'Thomas Berger', phone: '+49 151 0000-1234', email: 't.berger@email.demo', vip: true, active: true },
  { id: 'c8', name: 'TecnoAgro Brasil Ltda.', type: 'Corporativo', document: '67.890.123/0001-45', contact: 'Paulo Henrique Sá', phone: '(62) 99288-3351', email: 'compras@tecnoagro.demo', vip: false, active: true },
  // Persona "Deputado Roberto" — cliente do setor político (autoridade pública).
  {
    id: 'c9',
    name: 'Deputado Roberto',
    type: 'Pessoa Física',
    document: '456.789.123-00',
    contact: 'Gabinete do Deputado',
    phone: '(61) 99215-4400',
    email: 'gabinete.roberto@email.demo',
    vip: true,
    discreet: true,
    preferences: 'Pontualidade rigorosa e motorista discreto. Agenda sujeita a mudanças de última hora. Sigilo absoluto sobre os deslocamentos.',
    active: true,
  },
];

const vehicles = [
  { id: 'v1', brand: 'Toyota', model: 'Corolla Altis Hybrid', plate: 'RTA1B23', year: 2024, color: 'Preto', seats: 4, category: 'Sedan Executivo', ownership: 'propria', ownerName: '', active: true },
  { id: 'v2', brand: 'Toyota', model: 'SW4 Diamond', plate: 'ROA2C45', year: 2023, color: 'Branco Pérola', seats: 6, category: 'SUV Executivo', ownership: 'propria', ownerName: '', active: true },
  { id: 'v3', brand: 'Volvo', model: 'XC60 Recharge', plate: 'RSX3D67', year: 2024, color: 'Cinza Grafite', seats: 4, category: 'SUV Executivo', ownership: 'propria', ownerName: '', active: true },
  { id: 'v4', brand: 'Mercedes-Benz', model: 'Sprinter 416 Executiva', plate: 'PBV4E89', year: 2022, color: 'Prata', seats: 15, category: 'Van Executiva', ownership: 'terceirizada', ownerName: 'Cerrado Vans Locações (fictícia)', active: true },
  { id: 'v5', brand: 'Honda', model: 'Accord Touring', plate: 'JKL5F12', year: 2023, color: 'Preto', seats: 4, category: 'Sedan Executivo', ownership: 'terceirizada', ownerName: 'Parceiro Junior', active: true },
  { id: 'v6', brand: 'Chevrolet', model: 'Spin Premier', plate: 'OVP-6234', year: 2021, color: 'Prata', seats: 6, category: 'Minivan', ownership: 'terceirizada', ownerName: 'Parceiro Dênis Aragão', active: true },
  { id: 'v7', brand: 'Hyundai', model: 'Azera', plate: 'JHG-4410', year: 2018, color: 'Preto', seats: 4, category: 'Sedan Executivo', ownership: 'propria', ownerName: '', active: false },
];

const drivers = [
  // Persona "Lucas" — chefe que também atua como motorista.
  { id: 'd1', name: 'Lucas', cpf: '111.222.333-44', cnh: '04512378901', cnhCategory: 'D', cnhExpiry: '2028-03-10', phone: '(61) 99100-1010', bond: 'proprio', languages: 'Português', active: true },
  { id: 'd2', name: 'Fernanda Castro', cpf: '222.333.444-55', cnh: '05623489012', cnhCategory: 'B', cnhExpiry: '2027-08-22', phone: '(61) 99202-3030', bond: 'proprio', languages: 'Português, Inglês', active: true },
  // Persona "Junior" — motorista freelancer parceiro.
  { id: 'd3', name: 'Junior', cpf: '333.444.555-66', cnh: '06734590123', cnhCategory: 'B', cnhExpiry: '2029-01-15', phone: '(61) 99303-4040', bond: 'parceiro', languages: 'Português', active: true },
  { id: 'd4', name: 'Dênis Aragão', cpf: '444.555.666-77', cnh: '07845601234', cnhCategory: 'D', cnhExpiry: '2027-11-30', phone: '(61) 99404-5050', bond: 'parceiro', languages: 'Português, Espanhol', active: true },
  { id: 'd5', name: 'Cláudio Menezes', cpf: '555.666.777-88', cnh: '08956712345', cnhCategory: 'E', cnhExpiry: '2028-06-05', phone: '(61) 99505-6060', bond: 'parceiro', languages: 'Português', active: true },
  { id: 'd6', name: 'Patrícia Lopes', cpf: '666.777.888-99', cnh: '09067823456', cnhCategory: 'B', cnhExpiry: '2026-12-20', phone: '(61) 99606-7070', bond: 'proprio', languages: 'Português, Inglês', active: true },
];

const interpreters = [
  { id: 'i1', name: 'Sofia Ribeiro', languages: 'Inglês, Espanhol', phone: '(61) 99707-8080', email: 'sofia.ribeiro@email.demo', dailyRate: 650, active: true },
  { id: 'i2', name: 'Henrique Hoffmann', languages: 'Alemão, Inglês', phone: '(61) 99808-9090', email: 'henrique.h@email.demo', dailyRate: 720, active: true },
  { id: 'i3', name: 'Mei Lin Chen', languages: 'Mandarim, Inglês', phone: '(11) 99909-1010', email: 'meilin@email.demo', dailyRate: 800, active: true },
];

const ROUTES = [
  { origin: 'Aeroporto Internacional de Brasília (BSB)', destination: 'Hotel Royal Tulip Brasília Alvorada', dur: 40, value: 280, tags: ['Aeroporto'] },
  { origin: 'Setor Hoteleiro Sul, Brasília', destination: 'Esplanada dos Ministérios, Brasília', dur: 30, value: 220, tags: ['Corporativo'] },
  { origin: 'Centro Internacional de Convenções do Brasil (CICB)', destination: 'Aeroporto Internacional de Brasília (BSB)', dur: 45, value: 300, tags: ['Evento', 'Aeroporto'] },
  { origin: 'Aeroporto Internacional de Brasília (BSB)', destination: 'Pirenópolis (GO)', dur: 150, value: 1200, tags: ['Turismo', 'Longa distância'] },
  { origin: 'Lago Sul, Brasília', destination: 'Setor de Embaixadas Sul, Brasília', dur: 30, value: 250, tags: ['Corporativo'] },
  { origin: 'Aeroporto Internacional de Brasília (BSB)', destination: 'Goiânia (GO) — Setor Marista', dur: 180, value: 1500, tags: ['Longa distância', 'Corporativo'] },
  { origin: 'Setor Hoteleiro Norte, Brasília', destination: 'Palácio do Itamaraty, Brasília', dur: 25, value: 240, tags: ['Corporativo'] },
  { origin: 'Noroeste, Brasília', destination: 'Aeroporto Internacional de Brasília (BSB)', dur: 35, value: 260, tags: ['Aeroporto'] },
  { origin: 'Setor Hoteleiro Norte, Brasília', destination: 'City tour: Catedral, Congresso e Ponte JK', dur: 240, value: 950, tags: ['Turismo'] },
  { origin: 'Aeroporto Internacional de Brasília (BSB)', destination: 'Park Way, Brasília', dur: 40, value: 290, tags: ['Aeroporto'] },
  // Rotas típicas da persona "Deputado Roberto": aeroporto, Congresso, ministérios e embaixadas.
  { origin: 'Aeroporto Internacional de Brasília (BSB)', destination: 'Congresso Nacional — Anexo IV da Câmara', dur: 30, value: 300, tags: ['Aeroporto', 'Corporativo'] },
  { origin: 'Congresso Nacional', destination: 'Esplanada dos Ministérios — Bloco D', dur: 20, value: 200, tags: ['Corporativo'] },
  { origin: 'Congresso Nacional', destination: 'Setor de Embaixadas Norte, Brasília', dur: 25, value: 240, tags: ['Corporativo'] },
];

const PASSENGERS = ['Sr. Augusto Lima', 'Delegação técnica Agrovale', 'Sra. Marina Faria', 'Executivos convidados', 'Dr. Ricardo Paes', 'Equipe de auditoria', 'Sr. Thomas Berger', 'Sra. Helena Duarte'];
const TIMES = ['06:30', '08:00', '09:30', '11:00', '13:30', '15:00', '17:30', '19:00'];
const FLIGHTS = ['LA 3542', 'G3 1680', 'AD 4410', 'LA 4728', '', 'G3 2015'];

/** Fator de preço por categoria de veículo (vans custam mais). */
const priceFactor = (vehicle) => (vehicle.category === 'Van Executiva' ? 1.6 : vehicle.category === 'SUV Executivo' ? 1.2 : 1);

export function buildSeed(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const iso = (offset) => toISODate(addDays(today, offset));
  const stamp = (offset, time = '08:00') => `${iso(offset)}T${time}:00`;
  const activeVehicles = vehicles.filter((v) => v.active);

  const services = [];
  const transactions = [];
  const fiscalDocs = [];
  let nextId = 1001;
  let txSeq = 1;

  const addService = ({ offset, time, routeIdx, clientId, vehicleId, driverId, interpreterId = null, status, notes = '', passengerIdx }) => {
    const route = ROUTES[routeIdx % ROUTES.length];
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    const value = Math.round((route.value * priceFactor(vehicle)) / 10) * 10 + (interpreterId ? 600 : 0);
    const id = nextId;
    nextId += 1;
    const createdOffset = Math.min(offset - 5, -1);
    const s = {
      id,
      clientId,
      date: iso(offset),
      time,
      durationMin: route.dur,
      origin: route.origin,
      destination: route.destination,
      passengerName: clientId === 'c9' ? 'Deputado Roberto' : PASSENGERS[(passengerIdx ?? id) % PASSENGERS.length],
      passengers: vehicle.category === 'Van Executiva' ? 8 : 2,
      flight: route.tags.includes('Aeroporto') ? FLIGHTS[id % FLIGHTS.length] : '',
      value,
      vehicleId,
      driverId,
      interpreterId,
      tags: [...route.tags],
      notes,
      status,
      createdAt: stamp(createdOffset, '10:15'),
      updatedAt: stamp(createdOffset, '10:15'),
      logs: [{ at: stamp(createdOffset, '10:15'), user: 'Lucas', action: 'Serviço criado com status "Agendado".' }],
    };
    if (status !== 'Agendado') {
      s.logs.push({ at: `${s.date}T${time}:00`, user: 'Jaellen', action: `Status alterado para "${status}".` });
    }
    services.push(s);
    return s;
  };

  const addTx = (tx) => {
    transactions.push({ id: `t${txSeq}`, active: true, createdBy: 'Jaellen', ...tx });
    txSeq += 1;
  };

  const addServiceFinance = (s) => {
    const vehicle = vehicles.find((v) => v.id === s.vehicleId);
    addTx({ serviceId: s.id, type: 'receita', category: 'Valor do serviço', description: `Serviço nº ${s.id}`, amount: s.value, date: s.date });
    addTx({ serviceId: s.id, type: 'despesa', category: 'Combustível', description: 'Abastecimento', amount: Math.round(s.durationMin * 1.1 + 35), date: s.date });
    if (s.tags.includes('Longa distância')) {
      addTx({ serviceId: s.id, type: 'despesa', category: 'Pedágio', description: 'Pedágios BR-060/BR-070', amount: 42.6, date: s.date });
      addTx({ serviceId: s.id, type: 'despesa', category: 'Diária', description: 'Diária do motorista', amount: 180, date: s.date });
    }
    if (s.tags.includes('Aeroporto')) {
      addTx({ serviceId: s.id, type: 'despesa', category: 'Estacionamento', description: 'Estacionamento BSB', amount: 24, date: s.date });
    }
    // Motorista parceiro dirigindo veículo próprio recebe diária (persona "Junior").
    const driver = drivers.find((d) => d.id === s.driverId);
    if (driver.bond === 'parceiro' && vehicle.ownership === 'propria' && !s.tags.includes('Longa distância')) {
      addTx({ serviceId: s.id, type: 'despesa', category: 'Diária', description: `Diária do motorista parceiro — ${driver.name}`, amount: 150, date: s.date });
    }
    if (vehicle.ownership === 'terceirizada') {
      addTx({ serviceId: s.id, type: 'despesa', category: 'Repasse a parceiro', description: `Repasse — ${vehicle.ownerName}`, amount: Math.round(s.value * 0.35), date: s.date });
    }
    if (s.interpreterId) {
      const it = interpreters.find((i) => i.id === s.interpreterId);
      addTx({ serviceId: s.id, type: 'despesa', category: 'Honorários de intérprete', description: it.name, amount: it.dailyRate, date: s.date });
    }
  };

  // ---- Serviços passados (últimos ~95 dias): concluídos e alguns cancelados ----
  for (let i = 0; i < 46; i += 1) {
    const offset = -(1 + Math.floor(i * 2));
    const vehicle = activeVehicles[i % activeVehicles.length];
    const driver = drivers[(i * 2 + 1) % drivers.length];
    const clientId = clients[(i * 5) % clients.length].id;
    const interpreterId = clientId === 'c7' ? 'i2' : i % 9 === 4 ? 'i1' : null;
    const cancelled = i === 7 || i === 19 || i === 34;
    const s = addService({
      offset,
      time: TIMES[i % TIMES.length],
      routeIdx: clientId === 'c9' ? 10 + (Math.floor(i / 9) % 3) : i,
      clientId,
      vehicleId: vehicle.id,
      driverId: driver.id,
      interpreterId,
      status: cancelled ? 'Cancelado' : 'Concluído',
      notes: cancelled ? 'Cancelado a pedido do cliente (mudança de agenda).' : '',
    });
    if (!cancelled) {
      addServiceFinance(s);
      if (i % 4 !== 1) {
        const type = clients.find((c) => c.id === s.clientId).type === 'Corporativo' ? 'NFS-e' : 'Recibo';
        fiscalDocs.push({ id: `f${s.id}`, serviceId: s.id, type, number: `${type === 'NFS-e' ? 'NFS' : 'REC'}-${2026}${String(s.id).slice(-3)}`, amount: s.value, issueDate: s.date, status: 'Emitida' });
      }
    }
  }

  // ---- Serviços de hoje ----
  addService({ offset: 0, time: '06:30', routeIdx: 7, clientId: 'c2', vehicleId: 'v1', driverId: 'd1', status: 'Concluído' });
  addService({ offset: 0, time: '10:00', routeIdx: 8, clientId: 'c7', vehicleId: 'v3', driverId: 'd2', interpreterId: 'i2', status: 'Em Andamento', notes: 'Cliente solicita água sem gás e jornal internacional.' });
  addService({ offset: 0, time: '18:30', routeIdx: 0, clientId: 'c6', vehicleId: 'v2', driverId: 'd6', status: 'Agendado', notes: 'Recepção com placa nominal no desembarque.' });
  addService({ offset: 0, time: '20:00', routeIdx: 2, clientId: 'c4', vehicleId: 'v4', driverId: 'd5', status: 'Agendado' });
  services.filter((s) => s.date === iso(0) && s.status === 'Concluído').forEach(addServiceFinance);

  // ---- Serviços futuros (próximas ~4 semanas) ----
  const future = [
    { offset: 1, time: '09:00', routeIdx: 1, clientId: 'c1', vehicleId: 'v1', driverId: 'd1', notes: 'Reunião no Ministério da Agricultura. Aguardar até o término.' },
    { offset: 1, time: '14:00', routeIdx: 3, clientId: 'c7', vehicleId: 'v3', driverId: 'd2', interpreterId: 'i2' },
    { offset: 2, time: '07:30', routeIdx: 5, clientId: 'c8', vehicleId: 'v5', driverId: 'd3' },
    { offset: 3, time: '08:00', routeIdx: 2, clientId: 'c4', vehicleId: 'v4', driverId: 'd5', notes: 'Transfer de palestrantes do congresso.' },
    { offset: 3, time: '16:00', routeIdx: 6, clientId: 'c5', vehicleId: 'v1', driverId: 'd6' },
    { offset: 5, time: '10:30', routeIdx: 4, clientId: 'c3', vehicleId: 'v2', driverId: 'd1' },
    { offset: 6, time: '05:45', routeIdx: 7, clientId: 'c6', vehicleId: 'v1', driverId: 'd2' },
    { offset: 8, time: '09:00', routeIdx: 8, clientId: 'c1', vehicleId: 'v4', driverId: 'd4', interpreterId: 'i3', notes: 'Comitiva internacional — intérprete de mandarim.' },
    { offset: 10, time: '13:00', routeIdx: 9, clientId: 'c2', vehicleId: 'v6', driverId: 'd4' },
    { offset: 12, time: '07:00', routeIdx: 5, clientId: 'c8', vehicleId: 'v2', driverId: 'd5' },
    { offset: 15, time: '11:00', routeIdx: 0, clientId: 'c5', vehicleId: 'v5', driverId: 'd3' },
    { offset: 19, time: '08:30', routeIdx: 3, clientId: 'c3', vehicleId: 'v3', driverId: 'd6' },
    { offset: 24, time: '15:30', routeIdx: 2, clientId: 'c4', vehicleId: 'v4', driverId: 'd5' },
    // Agenda da persona "Deputado Roberto"
    { offset: 2, time: '10:00', routeIdx: 10, clientId: 'c9', vehicleId: 'v3', driverId: 'd1', notes: 'Chegada de voo — seguir direto ao Congresso. Não divulgar itinerário.' },
    { offset: 4, time: '15:00', routeIdx: 11, clientId: 'c9', vehicleId: 'v1', driverId: 'd6', notes: 'Reunião no ministério; horário de retorno pode mudar.' },
    { offset: 9, time: '08:00', routeIdx: 12, clientId: 'c9', vehicleId: 'v2', driverId: 'd1', notes: 'Agenda em embaixada. Motorista em traje social.' },
  ];
  future.forEach((f, idx) => {
    const s = addService({ ...f, status: 'Agendado', passengerIdx: idx });
    // Alguns serviços futuros já possuem sinal (adiantamento) lançado.
    if (idx % 4 === 0) {
      addTx({ serviceId: s.id, type: 'receita', category: 'Valor do serviço', description: 'Sinal de 50% (adiantamento)', amount: s.value / 2, date: iso(-1) });
    }
  });

  // ---- Despesas gerais da empresa (não vinculadas a um serviço) ----
  for (let m = 0; m < 4; m += 1) {
    const ref = new Date(today.getFullYear(), today.getMonth() - m, 5);
    const date = toISODate(ref);
    if (date > iso(0)) continue;
    addTx({ serviceId: null, type: 'despesa', category: 'Seguro', description: 'Seguro mensal da frota própria', amount: 890, date });
    addTx({ serviceId: null, type: 'despesa', category: 'Manutenção', description: m % 2 ? 'Revisão preventiva — SW4' : 'Troca de pneus — Corolla', amount: m % 2 ? 640 : 980, date: toISODate(new Date(ref.getFullYear(), ref.getMonth(), 12)) > iso(0) ? date : toISODate(new Date(ref.getFullYear(), ref.getMonth(), 12)) });
  }

  // ---- Templates de contratos (UC13) ----
  const templates = [
    {
      id: 'tp1',
      title: 'Contrato de Prestação de Serviço de Transporte Executivo',
      category: 'Contrato',
      body: `CONTRATO DE PRESTAÇÃO DE SERVIÇO DE TRANSPORTE EXECUTIVO

CONTRATANTE: {{cliente}}, inscrito(a) sob o documento {{documento_cliente}}.
CONTRATADA: ROAS Transfer — Transporte Executivo e Receptivo (dados fictícios para demonstração).

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem por objeto a prestação do serviço de transporte executivo nº {{servico}}, a ser realizado em {{data}}, às {{horario}}, com partida de {{origem}} e destino {{destino}}.

CLÁUSULA 2ª — DO VEÍCULO E CONDUTOR
O serviço será executado com o veículo {{veiculo}}, conduzido por {{motorista}}, podendo ser substituído por outro de categoria equivalente mediante comunicação prévia.

CLÁUSULA 3ª — DO VALOR
Pelo serviço, a CONTRATANTE pagará à CONTRATADA o valor de {{valor}}, conforme condições acordadas entre as partes.

CLÁUSULA 4ª — DO CANCELAMENTO
Cancelamentos com menos de 24 horas de antecedência poderão ser cobrados integralmente.

Brasília/DF, {{data_emissao}}.`,
      active: true,
      updatedAt: stamp(-40, '09:00'),
    },
    {
      id: 'tp2',
      title: 'Ordem de Serviço — Receptivo Aeroporto',
      category: 'Ordem de Serviço',
      body: `ORDEM DE SERVIÇO — RECEPTIVO

Serviço nº {{servico}}
Cliente: {{cliente}}
Data: {{data}} — Horário: {{horario}}
Embarque: {{origem}}
Destino: {{destino}}
Veículo: {{veiculo}}
Motorista: {{motorista}}

O motorista deverá aguardar o passageiro no portão de desembarque com placa de identificação nominal, com tolerância de 60 minutos após o pouso.

Valor acordado: {{valor}}

Emitido em {{data_emissao}}.`,
      active: true,
      updatedAt: stamp(-25, '14:30'),
    },
    {
      id: 'tp3',
      title: 'Termo de Confidencialidade do Atendimento',
      category: 'Termo',
      body: `TERMO DE CONFIDENCIALIDADE

A ROAS Transfer compromete-se a manter sigilo absoluto sobre informações, conversas e documentos a que seus motoristas e intérpretes tiverem acesso durante o atendimento nº {{servico}} prestado a {{cliente}} em {{data}}, no trajeto {{origem}} → {{destino}}.

Brasília/DF, {{data_emissao}}.`,
      active: true,
      updatedAt: stamp(-12, '16:45'),
    },
  ];

  // ---- Contratos gerados a partir de serviços (UC13/UC14) ----
  const db = { users, clients, vehicles, drivers, interpreters, services, transactions, fiscalDocs, templates };
  const contracts = [];
  const makeContract = (n, service, templateId, status, offsetCreated) => {
    const tpl = templates.find((t) => t.id === templateId);
    const createdAt = stamp(offsetCreated, '11:20');
    const content = renderTemplate(tpl.body, templateVariables(service, db));
    const c = {
      id: `ct${n}`,
      number: `CT-${today.getFullYear()}-${String(n).padStart(3, '0')}`,
      serviceId: service.id,
      templateId,
      title: tpl.title,
      content,
      status: 'Pendente',
      createdAt,
      history: [{ at: createdAt, status: 'Pendente', user: 'Jaellen', note: 'Contrato gerado a partir do template.' }],
      attachments: [],
      signature: null,
    };
    if (status === 'Enviado' || status === 'Assinado') {
      c.status = 'Enviado';
      c.history.push({ at: stamp(offsetCreated + 1, '09:10'), status: 'Enviado', user: 'Jaellen', note: 'Enviado ao cliente para conferência.' });
    }
    if (status === 'Assinado') {
      const at = stamp(offsetCreated + 2, '15:42');
      c.status = 'Assinado';
      c.signature = { signer: 'Jaellen', signerEmail: 'jaellen@roastransfer.demo', at, hash: Array.from({ length: 8 }, (_, k) => fnv1a(`${k}:${content}:${at}`)).join(''), method: 'Assinatura eletrônica simulada (senha do usuário)' };
      c.history.push({ at, status: 'Assinado', user: 'Jaellen', note: 'Assinatura eletrônica registrada.' });
      c.attachments.push({ id: `a${n}`, name: `proposta-comercial-${service.id}.pdf`, size: 184320, type: 'application/pdf', addedAt: stamp(offsetCreated, '11:30'), addedBy: 'Jaellen' });
    }
    contracts.push(c);
  };
  const past = services.filter((s) => s.status === 'Concluído');
  const upcoming = services.filter((s) => s.status === 'Agendado');
  makeContract(1, past[18], 'tp1', 'Assinado', -50);
  makeContract(2, past[3], 'tp1', 'Assinado', -15);
  makeContract(3, upcoming[1], 'tp1', 'Enviado', -3);
  makeContract(4, upcoming[3], 'tp2', 'Pendente', -2);
  makeContract(5, upcoming[7], 'tp3', 'Pendente', -1);

  return {
    version: SEED_VERSION,
    seededAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...db,
    contracts,
  };
}
