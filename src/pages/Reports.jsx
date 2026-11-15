import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileBarChart, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { network } from '../services/network';
import { groupByCategory, summarize, transactionsInRange } from '../utils/rules';
import { formatCurrency, formatDate, monthRange } from '../utils/format';
import { csvNumber, downloadFile, toCSV } from '../utils/csv';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { FINANCE_TABS } from '../components/ui/RouteTabs';
import { Badge, Button, Card, Field, Input } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

function CategoryBars({ title, items, total, barClass }) {
  return (
    <Card className="p-4">
      <p className="mb-3 text-[14px] font-semibold text-ink">{title}</p>
      {items.length === 0 && <p className="text-[13px] text-muted">Sem lançamentos.</p>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.category}>
            <div className="mb-1 flex justify-between text-[13px]">
              <span className="text-ink">
                {c.category} <span className="text-muted">({c.count})</span>
              </span>
              <span className="font-semibold text-ink">{formatCurrency(c.total)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div className={`h-full rounded-full ${barClass}`} style={{ width: `${total ? (c.total / total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** UC12 — relatório financeiro analítico por período. */
export default function Reports() {
  const { db } = useData();
  const toast = useToast();
  const now = new Date();
  const initial = monthRange(now.getFullYear(), now.getMonth());
  const [from, setFrom] = useState(initial.start);
  const [to, setTo] = useState(initial.end);
  const [state, setState] = useState({ status: 'idle' });

  const generate = async () => {
    if (!from || !to || from > to) {
      setState({ status: 'invalid' });
      return;
    }
    setState({ status: 'loading' });
    try {
      await network.request(350);
    } catch {
      toast.show('MSG38'); // FE 1.1
      setState({ status: 'error', code: 'MSG38' });
      return;
    }
    try {
      const list = transactionsInRange(db, from, to).sort((a, b) => a.date.localeCompare(b.date));
      if (!list.length) {
        toast.show('MSG37'); // CA 3.2
        setState({ status: 'empty' });
        return;
      }
      const totals = summarize(list);
      const groups = groupByCategory(list);
      setState({
        status: 'done',
        from,
        to,
        list,
        totals,
        revenueGroups: groups.filter((g) => g.type === 'receita'),
        expenseGroups: groups.filter((g) => g.type === 'despesa'),
        servicesCount: new Set(list.filter((t) => t.serviceId).map((t) => t.serviceId)).size,
      });
    } catch (e) {
      console.error(e);
      toast.show('MSG39'); // FE 3.1
      setState({ status: 'error', code: 'MSG39' });
    }
  };

  const exportCsv = () => {
    const rows = state.list.map((t) => ({
      ...t,
      client: db.clients.find((c) => c.id === db.services.find((s) => s.id === t.serviceId)?.clientId)?.name || '',
    }));
    const csv = toCSV(rows, [
      { key: 'date', label: 'Data', format: (v) => formatDate(v) },
      { key: 'type', label: 'Tipo' },
      { key: 'category', label: 'Categoria' },
      { key: 'description', label: 'Descrição' },
      { key: 'serviceId', label: 'Serviço nº', format: (v) => v || 'Despesa geral' },
      { key: 'client', label: 'Cliente' },
      { key: 'amount', label: 'Valor (R$)', format: (v, r) => csvNumber(r.type === 'despesa' ? -v : v) },
    ]);
    downloadFile(`gerto-relatorio-financeiro-${state.from}_a_${state.to}.csv`, csv);
  };

  return (
    <div>
      <PageHeader title="Relatórios Financeiros" subtitle="Balanço analítico de entradas, saídas e saldo líquido">
        <RouteTabs tabs={FINANCE_TABS} className="md:max-w-md" />
      </PageHeader>

      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Data inicial" required error={state.status === 'invalid' ? 'Informe um período válido' : undefined}>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} invalid={state.status === 'invalid'} />
          </Field>
          <Field label="Data final" required>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} invalid={state.status === 'invalid'} />
          </Field>
          <Button icon={FileBarChart} onClick={generate} loading={state.status === 'loading'}>
            Gerar Relatório
          </Button>
        </div>
      </Card>

      {state.status === 'idle' && <EmptyState icon={FileBarChart} text="Informe o período e clique em “Gerar Relatório”." />}
      {state.status === 'loading' && <LoadingState label="Consolidando lançamentos…" />}
      {state.status === 'empty' && <EmptyState code="MSG37" />}
      {state.status === 'error' && <ErrorState code={state.code} onRetry={generate} />}

      {state.status === 'done' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted">
              Período de <strong className="text-ink">{formatDate(state.from)}</strong> a <strong className="text-ink">{formatDate(state.to)}</strong> · {state.list.length} lançamento(s) · {state.servicesCount} serviço(s)
            </p>
            <Button variant="outline" size="sm" icon={Download} onClick={exportCsv}>
              Exportar CSV
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                <TrendingUp className="h-4 w-4" /> Entradas
              </p>
              <p className="mt-1 text-[24px] font-bold text-[#2f5b45] dark:text-sage">{formatCurrency(state.totals.revenue)}</p>
            </Card>
            <Card className="p-4">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
                <TrendingDown className="h-4 w-4" /> Saídas
              </p>
              <p className="mt-1 text-[24px] font-bold text-red-600 dark:text-red-400">{formatCurrency(state.totals.expenses)}</p>
            </Card>
            <Card className="bg-gradient-to-br from-petrol to-teal p-4 text-white">
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/80">
                <Wallet className="h-4 w-4" /> Saldo líquido
              </p>
              <p className="mt-1 text-[24px] font-bold">{formatCurrency(state.totals.net)}</p>
              {state.totals.margin !== null && <p className="text-[12px] text-white/80">Margem de {state.totals.margin.toFixed(1)}%</p>}
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <CategoryBars title="Entradas por categoria" items={state.revenueGroups} total={state.totals.revenue} barClass="bg-teal" />
            <CategoryBars title="Saídas por categoria" items={state.expenseGroups} total={state.totals.expenses} barClass="bg-petrol dark:bg-mint" />
          </div>

          <section>
            <h2 className="section-title">Detalhamento das transações</h2>
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Categoria</th>
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold">Serviço</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {state.list.map((t) => (
                    <tr key={t.id} className="hover:bg-surface/50">
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink">{formatDate(t.date)}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={t.type}>{t.type === 'receita' ? 'Receita' : 'Despesa'}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-ink">{t.category}</td>
                      <td className="px-4 py-2.5 text-muted">{t.description}</td>
                      <td className="px-4 py-2.5">
                        {t.serviceId ? (
                          <Link to={`/servicos/${t.serviceId}`} className="font-medium text-petrol dark:text-mint">
                            nº {t.serviceId}
                          </Link>
                        ) : (
                          <span className="text-muted">Geral</span>
                        )}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-2.5 text-right font-semibold ${t.type === 'receita' ? 'text-[#2f5b45] dark:text-sage' : 'text-red-600 dark:text-red-400'}`}>
                        {t.type === 'receita' ? '+' : '−'} {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
