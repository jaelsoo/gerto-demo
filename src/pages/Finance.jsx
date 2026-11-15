import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { serviceFinance } from '../utils/rules';
import { formatCurrency, formatDate, normalize } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { FINANCE_TABS } from '../components/ui/RouteTabs';
import ServiceFinancePanel from '../components/services/ServiceFinancePanel';
import { Badge, Card, Input, Segmented, cx } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

/** UC10 — gestão financeira por serviço: seleção do atendimento e lançamentos de receitas/despesas. */
export default function Finance() {
  const { db } = useData();
  const [params, setParams] = useSearchParams();
  const load = usePageLoad('MSG32'); // FE 1.1
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const selectedId = params.get('servico');
  const selected = db.services.find((s) => String(s.id) === selectedId);

  const rows = useMemo(() => {
    const q = normalize(query);
    return db.services
      .filter((s) => s.status !== 'Cancelado')
      .filter((s) => (scope === 'all' ? true : scope === 'done' ? s.status === 'Concluído' : s.status !== 'Concluído'))
      .map((s) => ({ s, client: db.clients.find((c) => c.id === s.clientId), fin: serviceFinance(s.id, db) }))
      .filter(({ s, client }) => !q || normalize(`${s.id} ${client?.name} ${s.destination}`).includes(q))
      .sort((a, b) => b.s.date.localeCompare(a.s.date));
  }, [db, query, scope]);

  const totals = rows.reduce((acc, r) => ({ revenue: acc.revenue + r.fin.revenue, expenses: acc.expenses + r.fin.expenses }), { revenue: 0, expenses: 0 });

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Receitas, despesas diretas e lucro líquido por serviço">
        <RouteTabs tabs={FINANCE_TABS} className="md:max-w-md" />
      </PageHeader>

      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG32" onRetry={load.reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Lista de serviços — oculta no smartphone quando um serviço está selecionado */}
          <section className={cx(selected && 'hidden lg:block')}>
            <div className="mb-3 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <Input className="pl-10" placeholder="Buscar serviço ou cliente" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <Segmented
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'open', label: 'Em aberto' },
                  { value: 'done', label: 'Concluídos' },
                ]}
              />
              <p className="text-[12.5px] text-muted">
                {rows.length} serviço(s) · Receitas {formatCurrency(totals.revenue)} · Despesas {formatCurrency(totals.expenses)}
              </p>
            </div>
            <Card className="max-h-[70vh] divide-y divide-line/70 overflow-y-auto">
              {rows.map(({ s, client, fin }) => (
                <button
                  key={s.id}
                  onClick={() => setParams({ servico: String(s.id) })}
                  className={cx('list-row w-full text-left', String(s.id) === selectedId && 'bg-teal/10')}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">
                      nº {s.id} · {client?.name}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {formatDate(s.date)} · {fin.count ? `${fin.count} lançamento(s)` : 'Sem lançamentos'}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={cx('block text-[14px] font-semibold', fin.net < 0 ? 'text-red-600 dark:text-red-400' : 'text-ink')}>{formatCurrency(fin.net)}</span>
                    <Badge className="mt-0.5">{s.status}</Badge>
                  </span>
                </button>
              ))}
            </Card>
          </section>

          <section className={cx(!selected && 'hidden lg:block')}>
            {selected ? (
              <>
                <button onClick={() => setParams({})} className="mb-2 inline-flex items-center gap-0.5 text-[15px] font-medium text-petrol dark:text-mint lg:hidden">
                  <ChevronLeft className="h-5 w-5" /> Serviços
                </button>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[20px] font-bold text-ink">Serviço nº {selected.id}</h2>
                    <p className="text-[13px] text-muted">
                      {db.clients.find((c) => c.id === selected.clientId)?.name} · {formatDate(selected.date)} · {selected.origin} → {selected.destination}
                    </p>
                  </div>
                  <Link to={`/servicos/${selected.id}`} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-petrol dark:text-mint">
                    Ficha <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <ServiceFinancePanel service={selected} />
              </>
            ) : (
              <EmptyState text="Selecione um serviço na lista para consultar ou registrar receitas e despesas." />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
