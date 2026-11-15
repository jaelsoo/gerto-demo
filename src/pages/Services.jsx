import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { SERVICE_STATUS, SERVICE_TAGS } from '../constants/domain';
import { formatMessage } from '../constants/messages';
import { matchesAllTags, serviceTags } from '../utils/rules';
import { formatDateLong, normalize, todayISO } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { OPERATION_TABS } from '../components/ui/RouteTabs';
import TagFilter from '../components/ui/TagFilter';
import ServiceCard from '../components/services/ServiceCard';
import ServiceForm from '../components/services/ServiceForm';
import { Button, Input, Segmented } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

const FILTER_TAGS = [...SERVICE_STATUS, 'Frota Própria', 'Terceirizada', 'VIP', 'Sigilo', ...SERVICE_TAGS];

/** UC03 (listagem e criação) + UC06 (etiquetas e filtros combinados). */
export default function Services() {
  const { db } = useData();
  const [params, setParams] = useSearchParams();
  const load = usePageLoad('MSG11');
  const [scope, setScope] = useState('upcoming');
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState([]);
  const formOpen = params.get('novo') === '1';

  const groups = useMemo(() => {
    const today = todayISO();
    const q = normalize(query);
    const list = db.services
      .filter((s) => (scope === 'upcoming' ? s.date >= today : true))
      .filter((s) => {
        if (!q) return true;
        const client = db.clients.find((c) => c.id === s.clientId);
        return normalize(`${s.id} ${client?.name} ${s.origin} ${s.destination} ${s.passengerName}`).includes(q);
      })
      .filter((s) => matchesAllTags(serviceTags(s, db), tags))
      .sort((a, b) => (scope === 'upcoming' ? 1 : -1) * (a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
    const map = new Map();
    list.forEach((s) => map.set(s.date, [...(map.get(s.date) || []), s]));
    return { entries: [...map.entries()], total: list.length };
  }, [db, scope, query, tags]);

  const clearAll = () => {
    setTags([]);
    setQuery('');
    setScope('all');
  };

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Fichas de atendimento, status e etiquetas"
        actions={
          <Button icon={Plus} onClick={() => setParams({ novo: '1' })}>
            Novo Serviço
          </Button>
        }
      >
        <RouteTabs tabs={OPERATION_TABS} className="md:max-w-md" />
      </PageHeader>

      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG11" onRetry={load.reload} />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <Input className="pl-10" placeholder="Buscar por nº, cliente, origem ou destino" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Segmented
                className="sm:w-64"
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'upcoming', label: 'A partir de hoje' },
                  { value: 'all', label: 'Todos' },
                ]}
              />
            </div>
            <TagFilter tags={FILTER_TAGS} selected={tags} onChange={setTags} />
          </div>

          <p className="mb-3 text-[12.5px] text-muted">{groups.total} serviço(s)</p>

          {groups.total === 0 ? (
            <EmptyState
              code={tags.length ? 'MSG21' : undefined}
              text={tags.length ? undefined : 'Nenhum serviço encontrado para a busca.'}
              action={
                <Button variant="secondary" size="sm" onClick={clearAll}>
                  {formatMessage('MSG22')}
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {groups.entries.map(([date, list]) => (
                <section key={date}>
                  <h2 className="section-title first-letter:uppercase">
                    {date === todayISO() ? 'Hoje · ' : ''}
                    {formatDateLong(date)}
                  </h2>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {list.map((s) => (
                      <ServiceCard key={s.id} service={s} showDate={false} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {/* [MSG14] — após agendar, permanece na tela de serviços */}
      <ServiceForm open={formOpen} onClose={() => setParams({})} />
    </div>
  );
}
