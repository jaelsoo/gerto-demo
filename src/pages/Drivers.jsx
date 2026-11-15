import { useData } from '../context/DataContext';
import { CNH_CATEGORIES, DRIVER_BOND } from '../constants/domain';
import { isValidCNH, maskCNH, maskCPF, maskPhone } from '../utils/masks';
import { formatDate, todayISO } from '../utils/format';
import RegistryPage from '../components/registry/RegistryPage';
import { REGISTRY_TABS } from '../components/ui/RouteTabs';
import { Avatar } from '../components/ui/primitives';

const FIELDS = [
  { key: 'name', label: 'Nome completo', required: true, span: 2 },
  { key: 'cpf', label: 'CPF', required: true, mask: maskCPF, inputMode: 'numeric', placeholder: '000.000.000-00' },
  { key: 'phone', label: 'Telefone / WhatsApp', required: true, mask: maskPhone, inputMode: 'tel', placeholder: '(61) 90000-0000' },
  { key: 'cnh', label: 'Nº da CNH', required: true, mask: maskCNH, inputMode: 'numeric', placeholder: '11 dígitos', validate: isValidCNH, invalidText: 'A CNH deve ter 11 dígitos' },
  { key: 'cnhCategory', label: 'Categoria da CNH', required: true, type: 'select', options: CNH_CATEGORIES },
  { key: 'cnhExpiry', label: 'Validade da CNH', required: true, type: 'date' },
  { key: 'bond', label: 'Vínculo', required: true, type: 'select', options: Object.entries(DRIVER_BOND).map(([value, label]) => ({ value, label })) },
  { key: 'languages', label: 'Idiomas', span: 2, placeholder: 'Ex.: Português, Inglês' },
];

const EMPTY = { name: '', cpf: '', phone: '', cnh: '', cnhCategory: '', cnhExpiry: '', bond: 'parceiro', languages: 'Português', active: true };

/** UC02 — Motoristas próprios e parceiros (validação de CNH duplicada — MSG13). */
export default function Drivers() {
  const { db, actions } = useData();
  const today = todayISO();
  return (
    <RegistryPage
      title="Motoristas"
      subtitle="Condutores próprios e parceiros"
      tabs={REGISTRY_TABS}
      entityLabel="Motorista"
      items={db.drivers}
      searchText={(d) => `${d.name} ${d.cpf} ${d.cnh} ${d.phone}`}
      tagsOf={(d) => [DRIVER_BOND[d.bond]]}
      filterTags={Object.values(DRIVER_BOND)}
      row={(d) => ({
        leading: <Avatar name={d.name} />,
        title: d.name,
        subtitle: `CNH ${d.cnh} · cat. ${d.cnhCategory} · ${d.phone}`,
        badges: [DRIVER_BOND[d.bond], d.cnhExpiry < today ? 'CNH vencida' : null, !d.active ? 'Inativo' : null],
        trailing: `CNH válida até ${formatDate(d.cnhExpiry)}`,
      })}
      fields={FIELDS}
      emptyItem={EMPTY}
      save={actions.saveDriver}
      setActive={actions.setDriverActive}
    />
  );
}
