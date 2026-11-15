import { Building2, UserRound } from 'lucide-react';
import { useData } from '../context/DataContext';
import { maskDocument, maskPhone } from '../utils/masks';
import RegistryPage from '../components/registry/RegistryPage';

const FIELDS = [
  { key: 'name', label: 'Nome / Razão social', required: true, span: 2 },
  { key: 'type', label: 'Tipo', required: true, type: 'select', options: ['Corporativo', 'Pessoa Física'] },
  { key: 'document', label: 'CPF / CNPJ', required: true, mask: maskDocument, inputMode: 'numeric' },
  { key: 'contact', label: 'Contato responsável' },
  { key: 'phone', label: 'Telefone', required: true, mask: maskPhone, inputMode: 'tel' },
  { key: 'email', label: 'E-mail', type: 'email', span: 2 },
  { key: 'vip', label: 'Cliente VIP', type: 'toggle', hint: 'Exibe a etiqueta VIP nos serviços deste cliente.' },
  {
    key: 'discreet',
    label: 'Exige sigilo',
    type: 'toggle',
    hint: 'Exibe a etiqueta "Sigilo" e oculta o nome do cliente no resumo para WhatsApp por padrão.',
  },
  { key: 'preferences', label: 'Preferências e cuidados no atendimento', type: 'textarea', placeholder: 'Ex.: pontualidade rigorosa, motorista discreto, agenda sujeita a mudanças…' },
];

/** Clientes corporativos e pessoas físicas (base para serviços, histórico e contratos). */
export default function Clients() {
  const { db, actions } = useData();
  return (
    <RegistryPage
      title="Clientes"
      subtitle="Clientes corporativos e executivos"
      entityLabel="Cliente"
      items={db.clients}
      searchText={(c) => `${c.name} ${c.document} ${c.contact} ${c.email}`}
      tagsOf={(c) => [c.type, ...(c.vip ? ['VIP'] : []), ...(c.discreet ? ['Sigilo'] : [])]}
      filterTags={['Corporativo', 'Pessoa Física', 'VIP', 'Sigilo']}
      row={(c) => {
        const done = db.services.filter((s) => s.clientId === c.id && s.status === 'Concluído').length;
        return {
          leading: (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-petrol/10 text-petrol dark:bg-petrol/25 dark:text-sand">
              {c.type === 'Corporativo' ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
            </span>
          ),
          title: c.name,
          subtitle: `${c.document} · ${c.contact || '—'} · ${c.phone}`,
          badges: [c.type, c.vip ? 'VIP' : null, c.discreet ? 'Sigilo' : null, !c.active ? 'Inativo' : null],
          trailing: `${done} atendimento(s) concluído(s)`,
        };
      }}
      fields={FIELDS}
      emptyItem={{ name: '', type: 'Corporativo', document: '', contact: '', phone: '', email: '', vip: false, discreet: false, preferences: '', active: true }}
      save={actions.saveClient}
      setActive={actions.setClientActive}
    />
  );
}
