import { useMemo, useState } from 'react';
import { Car, CheckCircle2, UserRound } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { usePageLoad } from '../../hooks/usePageLoad';
import { SERVICE_TAGS } from '../../constants/domain';
import { conflictMessageParams, freeResources } from '../../utils/rules';
import { formatTime, todayISO } from '../../utils/format';
import { parseMoney } from '../../utils/masks';
import Sheet from '../ui/Sheet';
import { Button, Chip, Field, Input, Select, Textarea } from '../ui/primitives';
import { ErrorState, InlineAlert, LoadingState } from '../ui/States';

const REQUIRED = ['clientId', 'date', 'time', 'durationMin', 'origin', 'destination', 'value', 'vehicleId', 'driverId'];

const emptyService = (date) => ({
  clientId: '',
  date: date || todayISO(),
  time: '',
  durationMin: 60,
  origin: '',
  destination: '',
  passengerName: '',
  passengers: 1,
  flight: '',
  value: '',
  vehicleId: '',
  driverId: '',
  interpreterId: '',
  tags: [],
  notes: '',
});

/** Formulário de criação/edição de serviço (UC03) com verificação de choque de frota (UC05). */
function ServiceFormInner({ onClose, initial, defaultDate, onSaved }) {
  const { db, actions } = useData();
  const toast = useToast();
  const load = usePageLoad('MSG16'); // FE 1.1 — falha ao carregar listas de apoio
  const editing = Boolean(initial?.id);
  const [form, setForm] = useState(() => (initial ? { ...initial, value: String(initial.value), interpreterId: initial.interpreterId || '' } : emptyService(defaultDate)));
  const [errors, setErrors] = useState({});
  const [conflict, setConflict] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
    if (['date', 'time', 'durationMin', 'vehicleId', 'driverId'].includes(key)) setConflict(null);
  };

  const clients = db.clients.filter((c) => c.active || c.id === form.clientId);
  const vehicles = db.vehicles.filter((v) => v.active || v.id === form.vehicleId);
  const drivers = db.drivers.filter((d) => d.active || d.id === form.driverId);
  const interpreters = db.interpreters.filter((i) => i.active || i.id === form.interpreterId);

  // Disponibilidade prévia: indica recursos já ocupados na janela informada.
  const availability = useMemo(() => {
    if (!form.date || !form.time || !form.durationMin) return null;
    return freeResources({ ...form, id: initial?.id }, db);
  }, [form, db, initial]);

  const submit = async () => {
    const payload = { ...form, value: parseMoney(form.value), durationMin: Number(form.durationMin) };
    const missing = REQUIRED.filter((k) => payload[k] === '' || payload[k] === null || payload[k] === undefined || Number.isNaN(payload[k]));
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((k) => [k, 'Campo obrigatório'])));
      toast.show('MSG12'); // FE 3.1 do UC02/UC03 — campos obrigatórios
      return;
    }
    setSaving(true);
    const res = await actions.saveService(payload);
    setSaving(false);
    if (res.ok) {
      onSaved?.(res.result.item);
      onClose();
      return;
    }
    const err = res.error;
    if (err?.code === 'MSG20') setConflict({ conflicts: err.conflicts, free: err.free });
    if (err?.fields) setErrors(Object.fromEntries(err.fields.map((k) => [k, err.code === 'MSG17' ? 'Data/hora retroativa' : 'Verifique este campo'])));
  };

  const pickResource = (kind, id) => {
    setForm((f) => ({ ...f, [kind]: id }));
    setConflict((c) => {
      if (!c) return c;
      const remaining = c.conflicts.filter((x) => (kind === 'vehicleId' ? x.kind !== 'vehicle' : x.kind !== 'driver'));
      return remaining.length ? { ...c, conflicts: remaining } : null;
    });
  };

  const footer = (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" onClick={onClose}>
        Cancelar
      </Button>
      <Button className="flex-[2]" onClick={submit} loading={saving} disabled={load.loading || !!load.error} icon={CheckCircle2}>
        {editing ? 'Salvar alterações' : 'Confirmar Agendamento'}
      </Button>
    </div>
  );

  return (
    <Sheet open onClose={onClose} title={editing ? `Editar serviço nº ${initial.id}` : 'Novo Serviço'} subtitle="Campos marcados com * são obrigatórios." footer={footer} size="lg">
      {load.loading ? (
        <LoadingState label="Carregando veículos e motoristas…" />
      ) : load.error ? (
        <ErrorState code="MSG16" onRetry={load.reload} />
      ) : (
        <div className="space-y-5">
          {conflict && (
            <div className="space-y-3">
              {conflict.conflicts.map((c, i) => (
                <InlineAlert key={i} code="MSG20" params={conflictMessageParams(c)}>
                  <p className="mt-1 text-[12px] opacity-80">{c.kind === 'vehicle' ? 'Recurso em conflito: veículo' : `Recurso em conflito: motorista ${c.label}`}</p>
                </InlineAlert>
              ))}
              {/* UC05 — CA 1.1: lista auxiliar de recursos livres na mesma janela */}
              <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4">
                <p className="text-[14px] font-semibold text-ink">Recursos livres neste horário</p>
                <p className="mb-3 text-[12.5px] text-muted">Selecione um substituto e confirme novamente.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {conflict.conflicts.some((c) => c.kind === 'vehicle') && (
                    <div>
                      <p className="label flex items-center gap-1.5"><Car className="h-4 w-4" /> Veículos disponíveis</p>
                      <div className="space-y-1.5">
                        {conflict.free.vehicles.length === 0 && <p className="text-[13px] text-muted">Nenhum veículo livre nesta janela.</p>}
                        {conflict.free.vehicles.map((v) => (
                          <button key={v.id} onClick={() => pickResource('vehicleId', v.id)} className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-left text-[13px] hover:border-teal">
                            <span>
                              <span className="font-medium text-ink">{v.model}</span> <span className="text-muted">· {v.plate} · {v.seats} lugares</span>
                            </span>
                            <span className="font-semibold text-petrol dark:text-mint">Usar</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {conflict.conflicts.some((c) => c.kind === 'driver') && (
                    <div>
                      <p className="label flex items-center gap-1.5"><UserRound className="h-4 w-4" /> Motoristas disponíveis</p>
                      <div className="space-y-1.5">
                        {conflict.free.drivers.length === 0 && <p className="text-[13px] text-muted">Nenhum motorista livre nesta janela.</p>}
                        {conflict.free.drivers.map((d) => (
                          <button key={d.id} onClick={() => pickResource('driverId', d.id)} className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-2 text-left text-[13px] hover:border-teal">
                            <span>
                              <span className="font-medium text-ink">{d.name}</span> <span className="text-muted">· CNH {d.cnhCategory}</span>
                            </span>
                            <span className="font-semibold text-petrol dark:text-mint">Usar</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <Field
              label="Cliente"
              required
              error={errors.clientId}
              className="md:col-span-2"
              hint={(() => {
                const c = clients.find((x) => x.id === form.clientId);
                return c?.preferences ? `${c.discreet ? '🔒 ' : ''}Preferências do cliente: ${c.preferences}` : undefined;
              })()}
            >
              <Select value={form.clientId} onChange={set('clientId')} invalid={!!errors.clientId}>
                <option value="">Selecione o cliente…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.vip ? ' (VIP)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data" required error={errors.date}>
              <Input type="date" min={editing ? undefined : todayISO()} value={form.date} onChange={set('date')} invalid={!!errors.date} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora de início" required error={errors.time}>
                <Input type="time" value={form.time} onChange={set('time')} invalid={!!errors.time} />
              </Field>
              <Field label="Duração (min)" required error={errors.durationMin}>
                <Input type="number" min={10} step={5} value={form.durationMin} onChange={set('durationMin')} invalid={!!errors.durationMin} />
              </Field>
            </div>
            <Field label="Local de partida" required error={errors.origin}>
              <Input value={form.origin} onChange={set('origin')} placeholder="Ex.: Aeroporto Internacional de Brasília (BSB)" invalid={!!errors.origin} />
            </Field>
            <Field label="Destino" required error={errors.destination}>
              <Input value={form.destination} onChange={set('destination')} placeholder="Ex.: Setor Hoteleiro Sul" invalid={!!errors.destination} />
            </Field>
            <Field label="Passageiro(s)">
              <Input value={form.passengerName} onChange={set('passengerName')} placeholder="Nome do passageiro principal" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nº de passageiros">
                <Input type="number" min={1} value={form.passengers} onChange={set('passengers')} />
              </Field>
              <Field label="Voo">
                <Input value={form.flight} onChange={set('flight')} placeholder="Ex.: LA 3542" />
              </Field>
            </div>
            <Field label="Valor do serviço (R$)" required error={errors.value}>
              <Input inputMode="decimal" value={form.value} onChange={set('value')} placeholder="0,00" invalid={!!errors.value} />
            </Field>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Field
              label="Veículo"
              required
              error={errors.vehicleId}
              hint={availability && form.vehicleId && !availability.vehicles.some((v) => v.id === form.vehicleId) ? '⚠ Ocupado neste horário' : undefined}
            >
              <Select value={form.vehicleId} onChange={set('vehicleId')} invalid={!!errors.vehicleId}>
                <option value="">Selecione o veículo…</option>
                {vehicles.map((v) => {
                  const busy = availability && !availability.vehicles.some((x) => x.id === v.id);
                  return (
                    <option key={v.id} value={v.id}>
                      {v.model} · {v.plate} ({v.ownership === 'propria' ? 'Própria' : 'Terceirizada'}){busy ? ' — ocupado' : ''}
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Field
              label="Motorista responsável"
              required
              error={errors.driverId}
              hint={availability && form.driverId && !availability.drivers.some((d) => d.id === form.driverId) ? '⚠ Ocupado neste horário' : undefined}
            >
              <Select value={form.driverId} onChange={set('driverId')} invalid={!!errors.driverId}>
                <option value="">Selecione o motorista…</option>
                {drivers.map((d) => {
                  const busy = availability && !availability.drivers.some((x) => x.id === d.id);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.bond === 'proprio' ? 'Próprio' : 'Parceiro'}){busy ? ' — ocupado' : ''}
                    </option>
                  );
                })}
              </Select>
            </Field>
            <Field label="Intérprete (opcional)">
              <Select value={form.interpreterId} onChange={set('interpreterId')}>
                <option value="">Sem intérprete</option>
                {interpreters.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {i.languages}
                  </option>
                ))}
              </Select>
            </Field>
          </section>

          <Field label="Etiquetas">
            <div className="flex flex-wrap gap-2">
              {SERVICE_TAGS.map((t) => (
                <Chip key={t} active={form.tags.includes(t)} onClick={() => set('tags')(form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t])}>
                  {t}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Instruções para o motorista, preferências do cliente…" />
          </Field>
          {form.date && form.time && (
            <p className="text-[12px] text-muted">
              Janela reservada: {form.time} às {formatTime(new Date(new Date(`${form.date}T${form.time}`).getTime() + Number(form.durationMin || 0) * 60000))}. Veículo e motorista serão verificados contra choques de agenda ao confirmar.
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

export default function ServiceForm({ open, ...props }) {
  if (!open) return null;
  return <ServiceFormInner {...props} />;
}
