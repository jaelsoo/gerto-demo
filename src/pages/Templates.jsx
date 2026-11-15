import { useRef, useState } from 'react';
import { FilePlus2, FileText, Pencil, Trash2, Wand2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { TEMPLATE_VARIABLES } from '../constants/domain';
import { extractVariables } from '../utils/rules';
import { formatDateTime } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import RouteTabs, { DOCUMENT_TABS } from '../components/ui/RouteTabs';
import Sheet from '../components/ui/Sheet';
import GenerateContractSheet from '../components/contracts/GenerateContractSheet';
import { Badge, Button, Card, Field, Input, Select, Textarea } from '../components/ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

function TemplateForm({ initial, onClose }) {
  const { actions } = useData();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef(null);

  const insertVar = (key) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    const start = el?.selectionStart ?? form.body.length;
    const end = el?.selectionEnd ?? form.body.length;
    const body = form.body.slice(0, start) + token + form.body.slice(end);
    setForm((f) => ({ ...f, body }));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const submit = async () => {
    const missing = ['title', 'body'].filter((k) => !String(form[k] || '').trim());
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((k) => [k, 'Campo obrigatório'])));
      toast.show('MSG12');
      return;
    }
    setSaving(true);
    const res = await actions.saveTemplate(form);
    setSaving(false);
    if (res.ok) onClose(); // FE 3.1 / FE 3.2: em falha, o formulário permanece aberto e o modelo anterior é preservado.
  };

  const used = extractVariables(form.body);

  return (
    <Sheet
      open
      onClose={onClose}
      size="lg"
      title={initial.id ? 'Editar template' : 'Novo Template'}
      subtitle="Use variáveis dinâmicas para preencher automaticamente os dados do serviço."
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-[2]" onClick={submit} loading={saving}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <Field label="Título" required error={errors.title}>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} invalid={!!errors.title} />
          </Field>
          <Field label="Categoria">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Contrato', 'Ordem de Serviço', 'Termo', 'Recibo'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div>
          <p className="label">Inserir variável</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                title={v.label}
                onClick={() => insertVar(v.key)}
                className="rounded-lg border border-line bg-card px-2 py-1 font-mono text-[12px] text-petrol hover:border-teal dark:bg-surface dark:text-mint"
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>
        <Field label="Corpo do documento" required error={errors.body}>
          <Textarea ref={bodyRef} className="min-h-[300px] font-mono text-[13px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} invalid={!!errors.body} />
        </Field>
        {used.length > 0 && (
          <p className="text-[12px] text-muted">
            Variáveis utilizadas: {used.map((u) => `{{${u}}}`).join(', ')}
          </p>
        )}
      </div>
    </Sheet>
  );
}

/** UC13 — templates de documentos e contratos (CRUD + "Utilizar Modelo"). */
export default function Templates() {
  const { db, actions } = useData();
  const toast = useToast();
  const load = usePageLoad('MSG42'); // FE 1.1
  const [editing, setEditing] = useState(null);
  const [using, setUsing] = useState(null);
  const list = db.templates.filter((t) => t.active);

  const inactivate = async (t) => {
    if (await toast.confirm('MSG09', { confirmLabel: 'Inativar' })) actions.setTemplateActive(t.id, false);
  };

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Modelos padronizados de contratos e documentos"
        actions={
          <Button icon={FilePlus2} onClick={() => setEditing({ title: '', category: 'Contrato', body: '' })}>
            Novo Template
          </Button>
        }
      >
        <RouteTabs tabs={DOCUMENT_TABS} className="md:max-w-xs" />
      </PageHeader>

      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG42" onRetry={load.reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={FileText} text="Nenhum template cadastrado." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <Card key={t.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/35 text-[#2f5b45] dark:bg-mint/15 dark:text-sage">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-snug text-ink">{t.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted">Atualizado em {formatDateTime(t.updatedAt)}</p>
                </div>
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-line text-[12.5px] leading-relaxed text-muted">{t.body}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>{t.category}</Badge>
                <Badge>{extractVariables(t.body).length} variáveis</Badge>
              </div>
              <div className="mt-4 flex gap-2 border-t border-line/70 pt-4">
                <Button size="sm" icon={Wand2} className="flex-1" onClick={() => setUsing(t.id)}>
                  Utilizar Modelo
                </Button>
                <Button size="sm" variant="outline" icon={Pencil} onClick={() => setEditing(t)}>
                  Editar
                </Button>
                <Button size="sm" variant="danger" onClick={() => inactivate(t)} aria-label="Inativar template">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && <TemplateForm initial={editing} onClose={() => setEditing(null)} />}
      <GenerateContractSheet open={!!using} templateId={using} onClose={() => setUsing(null)} />
    </div>
  );
}
