import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, Car, CheckCircle2, ClipboardList, FileSignature, History as HistoryIcon, Languages, MessageSquareText, Pencil, PlayCircle, Receipt, ShieldAlert, UserRound, Users, XCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { serviceTags, serviceWindow } from '../utils/rules';
import { formatCurrency, formatDate, formatDateTime, formatDuration, formatTime, formatWeekday } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import ServiceForm from '../components/services/ServiceForm';
import SummarySheet from '../components/services/SummarySheet';
import ServiceFinancePanel from '../components/services/ServiceFinancePanel';
import GenerateContractSheet from '../components/contracts/GenerateContractSheet';
import { Badge, Button, Card } from '../components/ui/primitives';
import { ErrorState, LoadingState } from '../components/ui/States';

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" aria-hidden />
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <div className="text-[14.5px] text-ink">{children}</div>
      </div>
    </div>
  );
}

const STATUS_ACTIONS = [
  { status: 'Em Andamento', label: 'Iniciar', icon: PlayCircle, variant: 'secondary' },
  { status: 'Concluído', label: 'Concluir', icon: CheckCircle2, variant: 'secondary' },
  { status: 'Cancelado', label: 'Cancelar serviço', icon: XCircle, variant: 'danger' },
];

/** UC03 — ficha detalhada do serviço (status, edição) + UC07 (resumo) + UC10 (financeiro) + UC13 (contrato). */
export default function ServiceDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const fromHistory = state?.from === 'historico';
  const navigate = useNavigate();
  const { db, actions } = useData();
  const toast = useToast();
  const load = usePageLoad('MSG26', [id]);
  const [editOpen, setEditOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  const service = db.services.find((s) => String(s.id) === String(id));

  // UC07 FE 1.1 / UC08 FE 3.1 — serviço inexistente: avisa e retorna à listagem.
  useEffect(() => {
    if (!load.loading && !load.error && !service) {
      toast.show(fromHistory ? 'MSG26' : 'MSG23');
      navigate(fromHistory ? '/historico' : '/servicos', { replace: true });
    }
  }, [load.loading, load.error, service, fromHistory, navigate, toast]);

  if (load.loading) return <LoadingState />;
  if (load.error) return <ErrorState code="MSG26" onRetry={load.reload} />;
  if (!service) return null;

  const client = db.clients.find((c) => c.id === service.clientId);
  const vehicle = db.vehicles.find((v) => v.id === service.vehicleId);
  const driver = db.drivers.find((d) => d.id === service.driverId);
  const interpreter = db.interpreters.find((i) => i.id === service.interpreterId);
  const contracts = db.contracts.filter((c) => c.serviceId === service.id);
  const fiscal = db.fiscalDocs.filter((f) => f.serviceId === service.id);
  const { end } = serviceWindow(service);
  const final = ['Concluído', 'Cancelado'].includes(service.status);

  const changeStatus = (status) => actions.updateServiceStatus(service.id, status);

  return (
    <div>
      <PageHeader
        back={fromHistory ? '/historico' : '/servicos'}
        title={`Serviço nº ${service.id}`}
        subtitle={`${client?.name || '—'} · ${formatDate(service.date)} às ${service.time}`}
        actions={
          <>
            <Button variant="whatsapp" icon={MessageSquareText} onClick={() => setSummaryOpen(true)}>
              Gerar Resumo
            </Button>
            {!final && (
              <Button variant="outline" icon={Pencil} onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {serviceTags(service, db).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {/* CA 3.1 — atualizar status */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12px] text-muted">Status atual</p>
                <Badge className="mt-1 text-[13px]">{service.status}</Badge>
              </div>
              {!final ? (
                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS.filter((a) => a.status !== service.status).map((a) => (
                    <Button key={a.status} size="sm" variant={a.variant} icon={a.icon} onClick={() => changeStatus(a.status)}>
                      {a.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-[12.5px] text-muted">Serviço finalizado — ficha disponível para consulta.</p>
              )}
            </div>
          </Card>

          <section>
            <h2 className="section-title">Itinerário</h2>
            <Card className="divide-y divide-line/70">
              <InfoRow icon={ClipboardList} label="Data e horário">
                <span className="first-letter:uppercase">{formatWeekday(service.date)}</span>, {formatDate(service.date)} · {service.time} às {formatTime(end)} ({formatDuration(service.durationMin)})
              </InfoRow>
              <div className="px-4 py-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal" />
                    <span className="my-1 w-px flex-1 bg-line" />
                    <ArrowDown className="h-3 w-3 text-muted" />
                    <span className="h-2.5 w-2.5 rounded-full bg-petrol" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[12px] text-muted">Partida</p>
                      <p className="text-[14.5px] text-ink">{service.origin}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-muted">Destino</p>
                      <p className="text-[14.5px] text-ink">{service.destination}</p>
                    </div>
                  </div>
                </div>
              </div>
              <InfoRow icon={Users} label="Passageiro(s)">
                {service.passengerName || '—'} · {service.passengers} pax{service.flight ? ` · Voo ${service.flight}` : ''}
              </InfoRow>
              {service.notes && (
                <InfoRow icon={MessageSquareText} label="Observações">
                  {service.notes}
                </InfoRow>
              )}
            </Card>
          </section>

          <section>
            <h2 className="section-title">Financeiro do serviço</h2>
            <ServiceFinancePanel service={service} />
          </section>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="section-title">Recursos alocados</h2>
            <Card className="divide-y divide-line/70">
              <InfoRow icon={Users} label="Cliente">
                <Link to={`/historico?cliente=${client?.id}`} className="font-medium text-petrol dark:text-mint">
                  {client?.name}
                </Link>
                <p className="text-[12.5px] text-muted">
                  {client?.contact} · {client?.phone}
                </p>
                {client?.preferences && (
                  <p className="mt-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[12.5px] text-amber-800 dark:text-amber-200">
                    {client.discreet && <ShieldAlert className="mr-1 inline h-3.5 w-3.5" />}
                    {client.preferences}
                  </p>
                )}
              </InfoRow>
              <InfoRow icon={Car} label="Veículo">
                {vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}` : '—'}
                {vehicle && <p className="text-[12.5px] text-muted">{vehicle.ownership === 'propria' ? 'Frota Própria' : `Terceirizada — ${vehicle.ownerName}`}</p>}
              </InfoRow>
              <InfoRow icon={UserRound} label="Motorista">
                {driver?.name || '—'}
                {driver && <p className="text-[12.5px] text-muted">{driver.phone} · CNH {driver.cnhCategory}</p>}
              </InfoRow>
              {interpreter && (
                <InfoRow icon={Languages} label="Intérprete">
                  {interpreter.name}
                  <p className="text-[12.5px] text-muted">{interpreter.languages}</p>
                </InfoRow>
              )}
              <InfoRow icon={Receipt} label="Valor negociado">
                <span className="font-semibold">{formatCurrency(service.value)}</span>
              </InfoRow>
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="section-title pb-0">Contratos</h2>
              <Button size="sm" variant="ghost" icon={FileSignature} onClick={() => setContractOpen(true)}>
                Gerar contrato
              </Button>
            </div>
            <Card className="divide-y divide-line/70">
              {contracts.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">Nenhum contrato vinculado a este serviço.</p>}
              {contracts.map((c) => (
                <Link key={c.id} to={`/contratos/${c.id}`} className="list-row justify-between">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-ink">{c.title}</span>
                    <span className="text-[12px] text-muted">{c.number}</span>
                  </span>
                  <Badge>{c.status}</Badge>
                </Link>
              ))}
            </Card>
          </section>

          <section>
            <h2 className="section-title">Documento fiscal</h2>
            <Card className="px-4 py-3 text-[13.5px]">
              {fiscal.length ? (
                fiscal.map((f) => (
                  <p key={f.id} className="flex items-center justify-between">
                    <span className="text-ink">
                      {f.type} {f.number}
                    </span>
                    <Badge>{f.status}</Badge>
                  </p>
                ))
              ) : (
                <p className="text-muted">
                  Sem recibo/nota registrado.{' '}
                  <Link to="/financeiro/contabil" className="font-medium text-petrol dark:text-mint">
                    Abrir Dashboard Contábil
                  </Link>
                </p>
              )}
            </Card>
          </section>

          <section>
            <h2 className="section-title flex items-center gap-1.5">
              <HistoryIcon className="h-4 w-4" /> Histórico de alterações
            </h2>
            <Card className="p-4">
              <ol className="relative space-y-4 border-l border-line pl-4">
                {[...service.logs].reverse().map((l, i) => (
                  <li key={i}>
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-teal" />
                    <p className="text-[13.5px] text-ink">{l.action}</p>
                    <p className="text-[11.5px] text-muted">
                      {formatDateTime(l.at)} · {l.user}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          </section>
        </div>
      </div>

      <ServiceForm open={editOpen} onClose={() => setEditOpen(false)} initial={service} />
      <SummarySheet open={summaryOpen} onClose={() => setSummaryOpen(false)} service={service} />
      <GenerateContractSheet open={contractOpen} onClose={() => setContractOpen(false)} serviceId={service.id} />
    </div>
  );
}
