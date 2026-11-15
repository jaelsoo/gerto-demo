import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, ChevronRight, FileSignature, Plus, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { activeTransactions, serviceWindow, summarize } from '../utils/rules';
import { MONTHS, MONTHS_SHORT, firstName, formatCurrency, monthKey, todayISO, toISODate } from '../utils/format';
import { formatMessage } from '../constants/messages';
import { SERVICE_STATUS } from '../constants/domain';
import PageHeader from '../components/ui/PageHeader';
import PullToRefresh from '../components/ui/PullToRefresh';
import BarChart from '../components/charts/BarChart';
import ServiceCard from '../components/services/ServiceCard';
import { Badge, Button, Card } from '../components/ui/primitives';
import { ErrorState, LoadingState, RenderBoundary } from '../components/ui/States';

function KpiCard({ to, icon: Icon, label, value, hint, empty, tone = 'petrol' }) {
  const tones = {
    petrol: 'bg-petrol/10 text-petrol dark:bg-petrol/25 dark:text-sand',
    teal: 'bg-teal/15 text-[#3d756b] dark:text-mint',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    sage: 'bg-sage/35 text-[#2f5b45] dark:bg-mint/15 dark:text-sage',
  };
  return (
    <Link to={to} className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-teal/50">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <ChevronRight className="h-4 w-4 text-muted/50 transition group-hover:translate-x-0.5" />
      </div>
      <p className="mt-3 text-[12.5px] font-medium text-muted">{label}</p>
      {empty ? (
        <p className="mt-1 text-[12.5px] leading-snug text-muted">
          {formatMessage('MSG34')} <span className="text-[10.5px] opacity-70">(MSG34)</span>
        </p>
      ) : (
        <>
          <p className="mt-0.5 text-[22px] font-bold tracking-tight text-ink md:text-[24px]">{value}</p>
          {hint && <p className="text-[12px] text-muted">{hint}</p>}
        </>
      )}
    </Link>
  );
}

function Indicators() {
  const { db } = useData();
  const now = new Date();
  const today = todayISO();
  const mk = monthKey(today);

  const stats = useMemo(() => {
    const tx = activeTransactions(db.transactions);
    const month = summarize(tx.filter((t) => monthKey(t.date) === mk));
    const servicesMonth = db.services.filter((s) => monthKey(s.date) === mk);
    const todayServices = db.services.filter((s) => s.date === today && s.status !== 'Cancelado').sort((a, b) => a.time.localeCompare(b.time));
    const upcoming = db.services
      .filter((s) => s.status === 'Agendado' && serviceWindow(s).start >= now)
      .sort((a, b) => serviceWindow(a).start - serviceWindow(b).start)
      .slice(0, 5);
    const chart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = toISODate(d).slice(0, 7);
      const s = summarize(tx.filter((t) => monthKey(t.date) === key));
      return { label: MONTHS_SHORT[d.getMonth()], values: [s.revenue, s.expenses] };
    });
    const statusCount = SERVICE_STATUS.map((st) => ({ status: st, count: servicesMonth.filter((s) => s.status === st).length }));
    const pendingContracts = db.contracts.filter((c) => c.status === 'Pendente' || c.status === 'Enviado').length;
    return { month, todayServices, upcoming, chart, statusCount, servicesMonth, pendingContracts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, mk, today]);

  const { month } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard to="/financeiro/relatorios" icon={TrendingUp} tone="sage" label="Faturamento do mês" value={formatCurrency(month.revenue)} hint={`${MONTHS[now.getMonth()]}`} empty={month.revenue === 0} />
        <KpiCard to="/financeiro/relatorios" icon={TrendingDown} tone="red" label="Despesas do mês" value={formatCurrency(month.expenses)} hint="Custos diretos e gerais" empty={month.expenses === 0} />
        <KpiCard
          to="/financeiro"
          icon={Wallet}
          tone="petrol"
          label="Lucro estimado"
          value={formatCurrency(month.net)}
          hint={month.margin !== null ? `Margem de ${month.margin.toFixed(1)}%` : undefined}
          empty={month.count === 0}
        />
        <KpiCard to="/agenda" icon={CalendarClock} tone="teal" label="Serviços hoje" value={stats.todayServices.length} hint={`${stats.servicesMonth.length} no mês`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title pb-0">Próximos atendimentos</h2>
            <Link to="/servicos" className="text-[13px] font-medium text-petrol dark:text-mint">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {stats.upcoming.length === 0 ? (
              <Card className="p-5 text-[13px] text-muted">{formatMessage('MSG34')} (MSG34)</Card>
            ) : (
              stats.upcoming.map((s) => <ServiceCard key={s.id} service={s} />)
            )}
          </div>
        </section>

        <section className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="section-title">Receitas x despesas (6 meses)</h2>
            <Card className="p-4">
              {stats.chart.every((c) => c.values[0] === 0 && c.values[1] === 0) ? (
                <p className="text-[13px] text-muted">{formatMessage('MSG34')} (MSG34)</p>
              ) : (
                <BarChart
                  data={stats.chart}
                  series={[
                    { name: 'Receitas', className: 'fill-teal' },
                    { name: 'Despesas', className: 'fill-sand dark:fill-petrol' },
                  ]}
                />
              )}
            </Card>
          </div>
          <div>
            <h2 className="section-title">Serviços do mês por status</h2>
            <Card className="divide-y divide-line/70">
              {stats.statusCount.map(({ status, count }) => (
                <Link key={status} to="/servicos" className="list-row justify-between">
                  <Badge>{status}</Badge>
                  <span className="text-[15px] font-semibold text-ink">{count}</span>
                </Link>
              ))}
              <Link to="/contratos" className="list-row justify-between">
                <span className="inline-flex items-center gap-2 text-[14px] text-ink">
                  <FileSignature className="h-4 w-4 text-muted" /> Contratos aguardando assinatura
                </span>
                <span className="text-[15px] font-semibold text-ink">{stats.pendingContracts}</span>
              </Link>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

/** UC11 — Dashboard operacional (tela inicial). */
export default function Dashboard() {
  const { user } = useAuth();
  const { refresh } = useData();
  const toast = useToast();
  const load = usePageLoad('MSG35');
  const navigate = useNavigate();

  const doRefresh = async () => {
    const ok = await refresh();
    if (!ok) toast.show('MSG35');
    else load.reload();
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <PullToRefresh onRefresh={doRefresh}>
      <PageHeader
        title={`${greeting}, ${firstName(user?.name)}`}
        subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={doRefresh}>
              Atualizar
            </Button>
            <Button size="sm" icon={Plus} onClick={() => navigate('/servicos?novo=1')}>
              Novo serviço
            </Button>
          </>
        }
      />
      {load.loading ? (
        <LoadingState label="Carregando indicadores…" />
      ) : load.error ? (
        <ErrorState code="MSG35" onRetry={load.reload} />
      ) : (
        <RenderBoundary code="MSG36">
          <Indicators />
        </RenderBoundary>
      )}
    </PullToRefresh>
  );
}
