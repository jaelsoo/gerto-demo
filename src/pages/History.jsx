import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarRange, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { formatCurrency } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { OPERATION_TABS } from '../components/ui/RouteTabs';
import ServiceCard from '../components/services/ServiceCard';
import { Button, Card, Field, Input, Select } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

/** UC08 — histórico cronológico de serviços concluídos com filtros por cliente e período. */
export default function History() {
  const { db } = useData();
  const [params, setParams] = useSearchParams();
  const load = usePageLoad('MSG25');
  const clientId = params.get('cliente') || '';
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const list = useMemo(
    () =>
      db.services
        .filter((s) => s.status === 'Concluído')
        .filter((s) => !clientId || s.clientId === clientId)
        .filter((s) => (!from || s.date >= from) && (!to || s.date <= to))
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [db.services, clientId, from, to],
  );

  const total = list.reduce((s, x) => s + Number(x.value), 0);
  const hasFilter = clientId || from || to;
  const clear = () => {
    setParams({});
    setFrom('');
    setTo('');
  };

  return (
    <div>
      <PageHeader title="Histórico de Serviços" subtitle="Atendimentos concluídos por cliente e período">
        <RouteTabs tabs={OPERATION_TABS} className="md:max-w-md" />
      </PageHeader>

      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG25" onRetry={load.reload} />
      ) : (
        <>
          <Card className="mb-5 p-4">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
              <Field label="Cliente">
                <Select value={clientId} onChange={(e) => setParams(e.target.value ? { cliente: e.target.value } : {})}>
                  <option value="">Todos os clientes</option>
                  {db.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Data inicial">
                <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="Data final">
                <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
              </Field>
              <Button variant="outline" icon={X} onClick={clear} disabled={!hasFilter}>
                Limpar
              </Button>
            </div>
          </Card>

          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4" /> {list.length} atendimento(s) concluído(s)
            </span>
            <span>
              Valor total: <strong className="text-ink">{formatCurrency(total)}</strong>
            </span>
          </div>

          {list.length === 0 ? (
            <EmptyState text="Nenhum atendimento concluído encontrado para os filtros informados." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((s) => (
                <ServiceCard key={s.id} service={s} linkState={{ from: 'historico' }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
