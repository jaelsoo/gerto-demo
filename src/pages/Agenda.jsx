import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { MONTHS, formatDateLong, toISODate, todayISO } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { OPERATION_TABS } from '../components/ui/RouteTabs';
import ServiceCard from '../components/services/ServiceCard';
import ServiceForm from '../components/services/ServiceForm';
import { Button, Card, cx } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOT = { Agendado: 'bg-petrol dark:bg-mint', 'Em Andamento': 'bg-amber-500', Concluído: 'bg-sage', Cancelado: 'bg-red-400' };

/** UC04 — calendário mensal interativo com marcadores e listagem do dia selecionado. */
export default function Agenda() {
  const { db } = useData();
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [formOpen, setFormOpen] = useState(false);
  // CA 3.1 — cada navegação de mês consulta novamente a "API".
  const load = usePageLoad('MSG18', [cursor.y, cursor.m]);

  const byDate = useMemo(() => {
    const map = new Map();
    db.services.forEach((s) => map.set(s.date, [...(map.get(s.date) || []), s]));
    map.forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [db.services]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: toISODate(d), day: d.getDate(), inMonth: d.getMonth() === cursor.m };
    });
  }, [cursor]);

  const move = (delta) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const goToday = () => {
    const d = new Date();
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(today);
  };

  const dayServices = byDate.get(selected) || [];
  const monthPrefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  const monthCount = db.services.filter((s) => s.date.startsWith(monthPrefix) && s.status !== 'Cancelado').length;

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Escala mensal e diária de atendimentos"
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)} disabled={selected < today}>
            Novo nesta data
          </Button>
        }
      >
        <RouteTabs tabs={OPERATION_TABS} className="md:max-w-md" />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold text-ink">
                {MONTHS[cursor.m]} <span className="font-normal text-muted">{cursor.y}</span>
              </h2>
              <p className="text-[12px] text-muted">{monthCount} serviço(s) ativos/concluídos no mês</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goToday} className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-petrol hover:bg-surface dark:text-mint">
                Hoje
              </button>
              <button onClick={() => move(-1)} className="rounded-full p-2 text-ink hover:bg-surface" aria-label="Mês anterior">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => move(1)} className="rounded-full p-2 text-ink hover:bg-surface" aria-label="Próximo mês">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {load.loading ? (
            <LoadingState label="Carregando agenda…" />
          ) : load.error ? (
            <ErrorState code="MSG18" onRetry={load.reload} />
          ) : (
            <>
              <div className="grid grid-cols-7 text-center text-[11.5px] font-semibold uppercase text-muted">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="pb-2">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Calendário de ${MONTHS[cursor.m]}`}>
                {cells.map((c) => {
                  const list = byDate.get(c.iso) || [];
                  const active = list.filter((s) => s.status !== 'Cancelado');
                  const isSel = c.iso === selected;
                  const isToday = c.iso === today;
                  return (
                    <button
                      key={c.iso}
                      role="gridcell"
                      aria-selected={isSel}
                      aria-label={`${c.day}: ${list.length} serviço(s)`}
                      onClick={() => setSelected(c.iso)}
                      className={cx(
                        'flex aspect-square flex-col items-center justify-start rounded-xl pt-1.5 text-[14px] transition md:pt-2',
                        !c.inMonth && 'opacity-35',
                        isSel ? 'bg-primary text-white' : 'hover:bg-surface',
                        !isSel && active.length > 0 && 'bg-teal/[.08]',
                      )}
                    >
                      <span className={cx('inline-flex h-7 w-7 items-center justify-center rounded-full font-semibold', isToday && !isSel && 'text-red-500')}>{c.day}</span>
                      {list.length > 0 && (
                        <span className="mt-0.5 flex gap-0.5">
                          {list.slice(0, 3).map((s) => (
                            <span key={s.id} className={cx('h-1.5 w-1.5 rounded-full', isSel ? 'bg-white' : DOT[s.status])} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[11.5px] text-muted">
                {Object.entries(DOT).map(([st, cls]) => (
                  <span key={st} className="inline-flex items-center gap-1.5">
                    <span className={cx('h-2 w-2 rounded-full', cls)} /> {st}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <section>
          <h2 className="section-title first-letter:uppercase">{formatDateLong(selected)}</h2>
          <div className="space-y-3">
            {load.loading || load.error ? null : dayServices.length === 0 ? (
              <EmptyState code="MSG19" />
            ) : (
              dayServices.map((s) => <ServiceCard key={s.id} service={s} showDate={false} />)
            )}
          </div>
        </section>
      </div>

      <ServiceForm open={formOpen} onClose={() => setFormOpen(false)} defaultDate={selected} />
    </div>
  );
}
