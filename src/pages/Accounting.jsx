import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, FileCheck2, FileClock, Percent, Receipt, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { formatMessage } from '../constants/messages';
import { FISCAL_DOC_TYPES } from '../constants/domain';
import { groupByCategory, summarize, transactionsInRange } from '../utils/rules';
import { MONTHS, formatCurrency, formatDate, monthRange } from '../utils/format';
import { csvNumber, downloadFile, toCSV } from '../utils/csv';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { FINANCE_TABS } from '../components/ui/RouteTabs';
import PullToRefresh from '../components/ui/PullToRefresh';
import { Badge, Button, Card, Select } from '../components/ui/primitives';
import { ErrorState, InlineAlert, LoadingState, RenderBoundary } from '../components/ui/States';

function Indicator({ icon: Icon, label, value, hint, missing }) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
        <Icon className="h-4 w-4" /> {label}
      </p>
      {missing ? (
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          {formatMessage('MSG51')} <span className="text-[10.5px] opacity-70">(MSG51)</span>
        </p>
      ) : (
        <>
          <p className="mt-1 text-[22px] font-bold text-ink">{value}</p>
          {hint && <p className="text-[12px] text-muted">{hint}</p>}
        </>
      )}
    </Card>
  );
}

/** Consolida os dados contábeis do mês. Lança erro tratado como [MSG53]. */
function consolidate(db, start, end) {
  const tx = transactionsInRange(db, start, end);
  const totals = summarize(tx);
  const services = db.services.filter((s) => s.date >= start && s.date <= end && s.status === 'Concluído');
  const rows = services
    .map((s) => {
      const doc = db.fiscalDocs.find((f) => f.serviceId === s.id && f.status === 'Emitida');
      const client = db.clients.find((c) => c.id === s.clientId);
      return { service: s, client, doc };
    })
    .sort((a, b) => b.service.date.localeCompare(a.service.date));
  const issued = rows.filter((r) => r.doc);
  const pending = rows.filter((r) => !r.doc);
  return {
    tx,
    totals,
    rows,
    issued,
    pending,
    issuedValue: issued.reduce((s, r) => s + r.doc.amount, 0),
    pendingValue: pending.reduce((s, r) => s + Number(r.service.value), 0),
    byType: FISCAL_DOC_TYPES.map((t) => ({ type: t, count: issued.filter((r) => r.doc.type === t).length })),
    expenseGroups: groupByCategory(tx).filter((g) => g.type === 'despesa'),
  };
}

function Panel({ ym }) {
  const { db, actions } = useData();
  const { start, end } = monthRange(ym.y, ym.m);
  let data;
  try {
    data = consolidate(db, start, end);
  } catch (e) {
    console.error(e);
    return <ErrorState code="MSG53" />;
  }

  const exportCsv = () => {
    const txRows = data.tx.map((t) => ({ ...t, kind: 'Lançamento' }));
    const csv = toCSV(
      [
        ...txRows,
        ...data.rows.map((r) => ({
          kind: 'Situação fiscal',
          date: r.service.date,
          type: 'receita',
          category: r.doc ? `${r.doc.type} ${r.doc.number}` : 'Documento fiscal pendente',
          description: `Serviço nº ${r.service.id} — ${r.client?.name}`,
          serviceId: r.service.id,
          amount: r.service.value,
          fiscal: r.doc ? 'Emitida' : 'Pendente',
        })),
      ],
      [
        { key: 'kind', label: 'Registro' },
        { key: 'date', label: 'Data', format: (v) => formatDate(v) },
        { key: 'type', label: 'Tipo' },
        { key: 'category', label: 'Categoria / Documento' },
        { key: 'description', label: 'Descrição' },
        { key: 'serviceId', label: 'Serviço nº', format: (v) => v || '' },
        { key: 'amount', label: 'Valor (R$)', format: (v, r) => csvNumber(r.kind === 'Lançamento' && r.type === 'despesa' ? -v : v) },
        { key: 'fiscal', label: 'Status fiscal', format: (v) => v || '' },
      ],
    );
    const summary = toCSV(
      [
        { k: 'Receita bruta', v: data.totals.revenue },
        { k: 'Despesas', v: data.totals.expenses },
        { k: 'Resultado líquido', v: data.totals.net },
        { k: 'Valor com documento fiscal emitido', v: data.issuedValue },
        { k: 'Valor pendente de emissão', v: data.pendingValue },
      ],
      [
        { key: 'k', label: `Resumo contábil ${MONTHS[ym.m]}/${ym.y}` },
        { key: 'v', label: 'Valor (R$)', format: (v) => csvNumber(v) },
      ],
    );
    downloadFile(`gerto-contabil-${ym.y}-${String(ym.m + 1).padStart(2, '0')}.csv`, `${summary}\r\n\r\n${csv}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InlineAlert tone="info" className="flex-1">
          <p>Painel demonstrativo: não há integração com sistemas fiscais nem emissão oficial de notas — o status de emissão é registrado manualmente.</p>
        </InlineAlert>
        <Button variant="outline" icon={Download} onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicator icon={TrendingUp} label="Receita bruta" value={formatCurrency(data.totals.revenue)} missing={data.totals.revenue === 0} />
        <Indicator icon={TrendingDown} label="Despesas dedutíveis" value={formatCurrency(data.totals.expenses)} missing={data.totals.expenses === 0} />
        <Indicator
          icon={Percent}
          label="Resultado líquido"
          value={formatCurrency(data.totals.net)}
          hint={data.totals.margin !== null ? `Margem ${data.totals.margin.toFixed(1)}%` : undefined}
          missing={data.tx.length === 0}
        />
        <Indicator icon={Receipt} label="Serviços concluídos" value={data.rows.length} hint={`${formatCurrency(data.issuedValue + data.pendingValue)} faturados`} missing={data.rows.length === 0} />
        <Indicator icon={FileCheck2} label="Documentos emitidos" value={data.issued.length} hint={data.byType.map((b) => `${b.count} ${b.type}`).join(' · ')} missing={data.rows.length === 0} />
        <Indicator icon={FileClock} label="Pendentes de emissão" value={data.pending.length} hint={formatCurrency(data.pendingValue)} missing={data.rows.length === 0} />
        <Indicator
          icon={Percent}
          label="Cobertura fiscal"
          value={data.rows.length ? `${((data.issued.length / data.rows.length) * 100).toFixed(0)}%` : '—'}
          hint="Serviços com recibo/NFS-e"
          missing={data.rows.length === 0}
        />
        <Indicator icon={TrendingDown} label="Maior centro de custo" value={data.expenseGroups[0]?.category} hint={data.expenseGroups[0] ? formatCurrency(data.expenseGroups[0].total) : undefined} missing={!data.expenseGroups.length} />
      </div>

      <section>
        <h2 className="section-title">Status de emissão de recibos / notas fiscais</h2>
        <Card className="overflow-x-auto">
          {data.rows.length === 0 ? (
            <p className="p-4 text-[13px] text-muted">
              {formatMessage('MSG51')} (MSG51)
            </p>
          ) : (
            <table className="w-full min-w-[620px] text-left text-[13px]">
              <thead className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Serviço</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {data.rows.map(({ service, client, doc }) => (
                  <tr key={service.id}>
                    <td className="px-4 py-2.5">
                      <Link to={`/servicos/${service.id}`} className="font-medium text-petrol dark:text-mint">
                        nº {service.id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-ink">
                      {client?.name} <span className="text-muted">({client?.type})</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink">{formatDate(service.date)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-ink">{formatCurrency(service.value)}</td>
                    <td className="px-4 py-2.5">
                      {doc ? (
                        <span className="inline-flex items-center gap-2">
                          <Badge>Emitida</Badge>
                          <span className="text-muted">
                            {doc.type} {doc.number}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-2">
                          <Badge tone="Pendente">Pendente</Badge>
                          <Select
                            className="h-8 w-auto py-0 text-[12.5px]"
                            defaultValue=""
                            onChange={(e) => e.target.value && actions.issueFiscalDoc(service.id, e.target.value)}
                            aria-label="Registrar emissão"
                          >
                            <option value="">Registrar emissão…</option>
                            {FISCAL_DOC_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </Select>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </div>
  );
}

/** UC15 — Dashboard contábil consolidado com exportação CSV real. */
export default function Accounting() {
  const { refresh } = useData();
  const toast = useToast();
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const load = usePageLoad('MSG52', [ym.y, ym.m]); // FE 1.1

  const move = (d) =>
    setYm((c) => {
      const x = new Date(c.y, c.m + d, 1);
      return { y: x.getFullYear(), m: x.getMonth() };
    });

  const doRefresh = async () => {
    const ok = await refresh();
    if (!ok) toast.show('MSG52');
    else load.reload();
  };

  const label = useMemo(() => `${MONTHS[ym.m]} de ${ym.y}`, [ym]);

  return (
    <PullToRefresh onRefresh={doRefresh}>
      <PageHeader
        title="Dashboard Contábil"
        subtitle="Indicadores consolidados para a contabilidade mensal"
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={doRefresh}>
            Atualizar
          </Button>
        }
      >
        <RouteTabs tabs={FINANCE_TABS} className="md:max-w-md" />
      </PageHeader>

      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => move(-1)} className="rounded-full p-2 hover:bg-surface" aria-label="Mês anterior">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="min-w-[170px] text-center text-[17px] font-semibold text-ink">{label}</p>
        <button onClick={() => move(1)} className="rounded-full p-2 hover:bg-surface" aria-label="Próximo mês">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {load.loading ? (
        <LoadingState label="Consolidando lançamentos…" />
      ) : load.error ? (
        <ErrorState code="MSG52" onRetry={load.reload} />
      ) : (
        <RenderBoundary code="MSG54">
          <Panel ym={ym} />
        </RenderBoundary>
      )}
    </PullToRefresh>
  );
}
