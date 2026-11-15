import {
  BarChart3,
  Calculator,
  CalendarDays,
  Car,
  ClipboardList,
  FileSignature,
  FileText,
  History,
  Home,
  Languages,
  LayoutGrid,
  Settings,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

/** Estrutura de navegação única — compartilhada pela Sidebar (tablet/desktop), Tab Bar e tela "Mais" (smartphone). */
export const NAV_SECTIONS = [
  {
    title: 'Geral',
    items: [{ to: '/', label: 'Início', icon: Home, end: true, mvp: 4 }],
  },
  {
    title: 'Operação',
    items: [
      { to: '/servicos', label: 'Serviços', icon: ClipboardList, mvp: 1 },
      { to: '/agenda', label: 'Agenda', icon: CalendarDays, mvp: 2 },
      { to: '/historico', label: 'Histórico por Cliente', icon: History, mvp: 3 },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { to: '/frota', label: 'Frota', icon: Car, mvp: 1 },
      { to: '/motoristas', label: 'Motoristas', icon: UserRound, mvp: 1 },
      { to: '/interpretes', label: 'Intérpretes', icon: Languages, mvp: 1 },
      { to: '/clientes', label: 'Clientes', icon: Users, mvp: 1 },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { to: '/financeiro', label: 'Financeiro por Serviço', icon: Wallet, end: true, mvp: 4 },
      { to: '/financeiro/relatorios', label: 'Relatórios', icon: BarChart3, mvp: 4 },
      { to: '/financeiro/contabil', label: 'Dashboard Contábil', icon: Calculator, mvp: 5 },
    ],
  },
  {
    title: 'Documentos',
    items: [
      { to: '/contratos', label: 'Contratos', icon: FileSignature, end: true, mvp: 5 },
      { to: '/contratos/templates', label: 'Templates', icon: FileText, mvp: 5 },
    ],
  },
  {
    title: 'Sistema',
    items: [{ to: '/configuracoes', label: 'Configurações', icon: Settings, mvp: 1 }],
  },
];

/** Abas principais do smartphone. `match` define quais rotas mantêm a aba ativa. */
export const TAB_ITEMS = [
  { to: '/', label: 'Início', icon: Home, match: (p) => p === '/' },
  { to: '/servicos', label: 'Agenda', icon: CalendarDays, match: (p) => /^\/(servicos|agenda)/.test(p) },
  { to: '/frota', label: 'Frota', icon: Car, match: (p) => /^\/(frota|motoristas|interpretes)/.test(p) },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, match: (p) => /^\/financeiro/.test(p) },
  { to: '/mais', label: 'Mais', icon: LayoutGrid, match: (p) => /^\/(mais|clientes|contratos|configuracoes|historico)/.test(p) },
];

/** Itens exibidos na tela "Mais" do smartphone (módulos secundários). */
export const MORE_ITEMS = [
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/motoristas', label: 'Motoristas', icon: UserRound },
  { to: '/interpretes', label: 'Intérpretes', icon: Languages },
  { to: '/historico', label: 'Histórico por Cliente', icon: History },
  { to: '/contratos', label: 'Contratos', icon: FileSignature },
  { to: '/contratos/templates', label: 'Templates de Documentos', icon: FileText },
  { to: '/financeiro/relatorios', label: 'Relatórios Financeiros', icon: BarChart3 },
  { to: '/financeiro/contabil', label: 'Dashboard Contábil', icon: Calculator },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];
