import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FilePlus2, FileSignature, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { formatDate, normalize } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { DOCUMENT_TABS } from '../components/ui/RouteTabs';
import GenerateContractSheet from '../components/contracts/GenerateContractSheet';
import { Badge, Button, Card, Chip, Input } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

const STATUS_FILTERS = ['Pendente', 'Enviado', 'Assinado'];

/** UC14 — listagem de contratos e controle de status. */
export default function Contracts() {
  const { db } = useData();
  const load = usePageLoad('MSG48');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const q = normalize(query);
    return db.contracts
      .map((c) => {
        const service = db.services.find((s) => s.id === c.serviceId);
        return { c, service, client: db.clients.find((x) => x.id === service?.clientId) };
      })
      .filter(({ c }) => !status || c.status === status)
      .filter(({ c, client }) => !q || normalize(`${c.number} ${c.title} ${client?.name} ${c.serviceId}`).includes(q))
      .sort((a, b) => b.c.createdAt.localeCompare(a.c.createdAt));
  }, [db, status, query]);

  const counts = STATUS_FILTERS.map((s) => ({ s, n: db.contracts.filter((c) => c.status === s).length }));

  return (
    <div>
      <PageHeader
        title="Documentos e Contratos"
        subtitle="Contratos gerados a partir de templates e assinatura eletrônica"
        actions={
          <Button icon={FilePlus2} onClick={() => setOpen(true)}>
            Novo contrato
          </Button>
        }
      >
        <RouteTabs tabs={DOCUMENT_TABS} className="md:max-w-xs" />
      </PageHeader>

      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG48" onRetry={load.reload} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {counts.map(({ s, n }) => (
              <Card key={s} className="p-3 text-center">
                <p className="text-[22px] font-bold text-ink">{n}</p>
                <Badge className="mt-1">{s}</Badge>
              </Card>
            ))}
          </div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
              <Input className="pl-10" placeholder="Buscar por número, cliente ou serviço" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="scrollbar-none flex gap-2 overflow-x-auto">
              <Chip active={!status} onClick={() => setStatus('')}>
                Todos
              </Chip>
              {STATUS_FILTERS.map((s) => (
                <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState text="Nenhum contrato encontrado." icon={FileSignature} />
          ) : (
            <Card className="divide-y divide-line/70 overflow-hidden">
              {list.map(({ c, service, client }) => (
                <Link key={c.id} to={`/contratos/${c.id}`} className="list-row">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-petrol/10 text-petrol dark:bg-petrol/25 dark:text-sand">
                    <FileSignature className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-ink">{c.title}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {c.number} · {client?.name || '—'} · Serviço nº {c.serviceId}
                      {service ? ` (${formatDate(service.date)})` : ''}
                    </span>
                  </span>
                  <Badge>{c.status}</Badge>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted/50" />
                </Link>
              ))}
            </Card>
          )}
        </>
      )}
      <GenerateContractSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
