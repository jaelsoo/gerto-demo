import { useLocation, useNavigate } from 'react-router-dom';
import { Segmented } from './primitives';

/** Abas segmentadas que navegam entre rotas irmãs de um mesmo módulo. */
export default function RouteTabs({ tabs, className }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = tabs.find((t) => t.to === pathname)?.to || tabs[0].to;
  return <Segmented className={className} value={current} onChange={(to) => navigate(to)} options={tabs.map((t) => ({ value: t.to, label: t.label }))} />;
}

export const OPERATION_TABS = [
  { to: '/servicos', label: 'Serviços' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/historico', label: 'Histórico' },
];

export const REGISTRY_TABS = [
  { to: '/frota', label: 'Veículos' },
  { to: '/motoristas', label: 'Motoristas' },
  { to: '/interpretes', label: 'Intérpretes' },
];

export const FINANCE_TABS = [
  { to: '/financeiro', label: 'Por serviço' },
  { to: '/financeiro/relatorios', label: 'Relatórios' },
  { to: '/financeiro/contabil', label: 'Contábil' },
];

export const DOCUMENT_TABS = [
  { to: '/contratos', label: 'Contratos' },
  { to: '/contratos/templates', label: 'Templates' },
];
