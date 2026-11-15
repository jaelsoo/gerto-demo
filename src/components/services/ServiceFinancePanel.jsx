import { useMemo, useState } from 'react';
import { Minus, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from '../../constants/domain';
import { serviceTransactions, summarize } from '../../utils/rules';
import { formatCurrency, formatDate, todayISO } from '../../utils/format';
import { parseMoney } from '../../utils/masks';
import Sheet from '../ui/Sheet';
import { Badge, Button, Field, Input, Segmented, Select } from '../ui/primitives';
import { EmptyState, ErrorState } from '../ui/States';

function TransactionForm({ open, onClose, service, initial }) {
  const { actions } = useData();
  const toast = useToast();
  const [form, setForm] = useState(
    () =>
      initial
        ? { ...initial, amount: String(initial.amount).replace('.', ',') }
        : { type: 'despesa', category: '', description: '', amount: '', date: service?.date && service.date <= todayISO() ? service.date : todayISO() },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v, ...(k === 'type' ? { category: '' } : {}) }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };
  const categories = form.type === 'receita' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const submit = async () => {
    const amount = parseMoney(form.amount);
    const missing = ['category', 'date'].filter((k) => !form[k]);
    if (!(amount > 0)) missing.push('amount');
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((k) => [k, 'Campo obrigatório'])));
      toast.show('MSG12');
      return;
    }
    setSaving(true);
    const res = await actions.saveTransaction({ ...form, amount, serviceId: service.id, description: form.description || form.category });
    setSaving(false);
    if (res.ok) onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={initial ? 'Editar lançamento' : 'Novo lançamento'}
      subtitle={`Serviço nº ${service.id}`}
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={submit} loading={saving}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Segmented
          value={form.type}
          onChange={set('type')}
          options={[
            { value: 'receita', label: 'Receita' },
            { value: 'despesa', label: 'Despesa' },
          ]}
        />
        <Field label="Categoria" required error={errors.category}>
          <Select value={form.category} onChange={set('category')} invalid={!!errors.category}>
            <option value="">Selecione…</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Descrição">
          <Input value={form.description} onChange={set('description')} placeholder="Ex.: Abastecimento posto BR-040" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)" required error={errors.amount}>
            <Input inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="0,00" invalid={!!errors.amount} />
          </Field>
          <Field label="Data" required error={errors.date}>
            <Input type="date" value={form.date} onChange={set('date')} invalid={!!errors.date} />
          </Field>
        </div>
      </div>
    </Sheet>
  );
}

/** UC10 — receitas e despesas diretas do serviço com cálculo automático do lucro líquido. */
export default function ServiceFinancePanel({ service }) {
  const { db, actions } = useData();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | transação

  const data = useMemo(() => {
    try {
      const list = serviceTransactions(service.id, db).sort((a, b) => a.date.localeCompare(b.date));
      return { list, summary: summarize(list) };
    } catch {
      return { error: 'MSG33' }; // FE 3.1
    }
  }, [service.id, db]);

  if (data.error) return <ErrorState code={data.error} />;
  const { list, summary } = data;
  const received = summary.revenue;
  const hasServiceRevenue = list.some((t) => t.type === 'receita');
  // Persona "Junior": o motorista parceiro precisa da garantia de recebimento da diária/repasse.
  const driver = db.drivers.find((d) => d.id === service.driverId);
  const partnerUnpaid =
    driver?.bond === 'parceiro' && service.status !== 'Cancelado' && !list.some((t) => ['Diária', 'Repasse a parceiro'].includes(t.category));

  const remove = async (t) => {
    if (await toast.confirm('MSG09', { confirmLabel: 'Inativar' })) actions.removeTransaction(t.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-sage/25 p-3 dark:bg-mint/10">
          <p className="flex items-center gap-1 text-[11.5px] font-medium text-muted">
            <TrendingUp className="h-3.5 w-3.5" /> Receitas
          </p>
          <p className="mt-1 text-[15px] font-bold text-ink md:text-[17px]">{formatCurrency(summary.revenue)}</p>
        </div>
        <div className="rounded-2xl bg-red-500/[.07] p-3">
          <p className="flex items-center gap-1 text-[11.5px] font-medium text-muted">
            <TrendingDown className="h-3.5 w-3.5" /> Despesas
          </p>
          <p className="mt-1 text-[15px] font-bold text-ink md:text-[17px]">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="rounded-2xl bg-petrol/10 p-3 dark:bg-petrol/25">
          <p className="flex items-center gap-1 text-[11.5px] font-medium text-muted">
            <Wallet className="h-3.5 w-3.5" /> Lucro líquido
          </p>
          <p className={`mt-1 text-[15px] font-bold md:text-[17px] ${summary.net < 0 ? 'text-red-600 dark:text-red-400' : 'text-ink'}`}>{formatCurrency(summary.net)}</p>
          {summary.margin !== null && <p className="text-[11px] text-muted">Margem {summary.margin.toFixed(1)}%</p>}
        </div>
      </div>
      {partnerUnpaid && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-800 dark:text-amber-200">
          Motorista parceiro ({driver.name}): diária/repasse ainda não lançado para este serviço.
        </p>
      )}
      <p className="text-[12px] text-muted">
        Valor contratado: <strong className="text-ink">{formatCurrency(service.value)}</strong> · Recebido/lançado: {formatCurrency(received)}
      </p>

      {list.length === 0 ? (
        <EmptyState
          code="MSG31"
          icon={Wallet}
          action={
            <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
              Adicionar primeiro lançamento
            </Button>
          }
        />
      ) : (
        <div className="card divide-y divide-line/70 overflow-hidden">
          {list.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.type === 'receita' ? 'bg-sage/40 text-[#2f5b45] dark:text-sage' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                {t.type === 'receita' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{t.description}</p>
                <p className="text-[12px] text-muted">
                  {t.category} · {formatDate(t.date)}
                </p>
              </div>
              <span className={`text-[14px] font-semibold ${t.type === 'receita' ? 'text-[#2f5b45] dark:text-sage' : 'text-red-600 dark:text-red-400'}`}>
                {t.type === 'receita' ? '+' : '−'} {formatCurrency(t.amount)}
              </span>
              <button onClick={() => setEditing(t)} className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink" aria-label="Editar lançamento">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(t)} className="rounded-lg p-1.5 text-muted hover:bg-red-500/10 hover:text-red-600" aria-label="Inativar lançamento">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Novo lançamento
          </Button>
          {!hasServiceRevenue && (
            <Badge tone="Pendente" className="self-center">
              Receita do serviço ainda não lançada
            </Badge>
          )}
        </div>
      )}

      {editing && <TransactionForm open onClose={() => setEditing(null)} service={service} initial={editing === 'new' ? null : editing} />}
    </div>
  );
}
