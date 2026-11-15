import { Languages } from 'lucide-react';
import { useData } from '../context/DataContext';
import { maskPhone } from '../utils/masks';
import { formatCurrency } from '../utils/format';
import RegistryPage from '../components/registry/RegistryPage';
import { REGISTRY_TABS } from '../components/ui/RouteTabs';

const FIELDS = [
  { key: 'name', label: 'Nome completo', required: true, span: 2 },
  { key: 'languages', label: 'Idiomas', required: true, placeholder: 'Ex.: Inglês, Espanhol' },
  { key: 'phone', label: 'Telefone / WhatsApp', required: true, mask: maskPhone, inputMode: 'tel' },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'dailyRate', label: 'Diária de referência (R$)', type: 'number' },
];

/** Prestadores parceiros — intérpretes alocáveis nos serviços (UC02/UC03). */
export default function Interpreters() {
  const { db, actions } = useData();
  return (
    <RegistryPage
      title="Intérpretes"
      subtitle="Prestadores parceiros para atendimentos bilíngues"
      tabs={REGISTRY_TABS}
      entityLabel="Intérprete"
      items={db.interpreters}
      searchText={(i) => `${i.name} ${i.languages}`}
      row={(i) => ({
        leading: (
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage/35 text-[#2f5b45] dark:text-sage">
            <Languages className="h-5 w-5" />
          </span>
        ),
        title: i.name,
        subtitle: `${i.languages} · ${i.phone}`,
        badges: [!i.active ? 'Inativo' : null],
        trailing: i.dailyRate ? `Diária ${formatCurrency(i.dailyRate)}` : null,
      })}
      fields={FIELDS}
      emptyItem={{ name: '', languages: '', phone: '', email: '', dailyRate: '', active: true }}
      save={actions.saveInterpreter}
      setActive={actions.setInterpreterActive}
    />
  );
}
