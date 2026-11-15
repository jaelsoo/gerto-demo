// Constantes de domínio da ROAS Transfer usadas em formulários, filtros e etiquetas.

export const SERVICE_STATUS = ['Agendado', 'Em Andamento', 'Concluído', 'Cancelado'];
/** Status que ocupam recursos (usados na verificação de choque de frota — UC05). */
export const ACTIVE_SERVICE_STATUS = ['Agendado', 'Em Andamento'];

export const OWNERSHIP = {
  propria: 'Frota Própria',
  terceirizada: 'Terceirizada',
};

export const VEHICLE_CATEGORIES = ['Sedan Executivo', 'SUV Executivo', 'Van Executiva', 'Minivan'];

export const DRIVER_BOND = {
  proprio: 'Motorista Próprio',
  parceiro: 'Parceiro',
};

export const CNH_CATEGORIES = ['B', 'C', 'D', 'E', 'AB', 'AD', 'AE'];

/** Etiquetas livres aplicáveis aos serviços (UC06). */
export const SERVICE_TAGS = ['Aeroporto', 'Corporativo', 'Evento', 'Turismo', 'Longa distância', 'Bilíngue'];

export const REVENUE_CATEGORIES = ['Valor do serviço', 'Hora extra', 'Adicional noturno', 'Outras receitas'];
export const EXPENSE_CATEGORIES = [
  'Combustível',
  'Pedágio',
  'Diária',
  'Estacionamento',
  'Alimentação',
  'Repasse a parceiro',
  'Honorários de intérprete',
  'Manutenção',
  'Seguro',
  'Outras despesas',
];

export const CONTRACT_STATUS = ['Pendente', 'Enviado', 'Assinado', 'Cancelado'];

export const FISCAL_DOC_TYPES = ['NFS-e', 'Recibo'];

/** Variáveis dinâmicas aceitas nos templates (UC13). */
export const TEMPLATE_VARIABLES = [
  { key: 'cliente', label: 'Nome do cliente' },
  { key: 'documento_cliente', label: 'CPF/CNPJ do cliente' },
  { key: 'data', label: 'Data do serviço' },
  { key: 'horario', label: 'Horário de início' },
  { key: 'origem', label: 'Local de partida' },
  { key: 'destino', label: 'Destino' },
  { key: 'valor', label: 'Valor do serviço' },
  { key: 'veiculo', label: 'Veículo e placa' },
  { key: 'motorista', label: 'Motorista responsável' },
  { key: 'servico', label: 'Número do serviço' },
  { key: 'data_emissao', label: 'Data de emissão' },
];
