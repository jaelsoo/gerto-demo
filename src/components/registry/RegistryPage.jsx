import { useMemo, useState } from 'react';
import { ChevronRight, Plus, RotateCcw, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { usePageLoad } from '../../hooks/usePageLoad';
import { formatMessage } from '../../constants/messages';
import { matchesAllTags } from '../../utils/rules';
import { normalize } from '../../utils/format';
import PageHeader from '../ui/PageHeader';
import RouteTabs from '../ui/RouteTabs';
import TagFilter from '../ui/TagFilter';
import Sheet from '../ui/Sheet';
import { Badge, Button, Card, Field, Input, Select, Textarea, Toggle } from '../ui/primitives';
import { EmptyState, ErrorState, LoadingState } from '../ui/States';

/**
 * Formulário genérico guiado por configuração de campos.
 * field: { key, label, required, type: text|select|date|number|toggle|textarea, options, mask, placeholder, hint, span, showIf }
 */
function EntityForm({ title, fields, initial, onSave, onClose, onInactivate }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const visible = fields.filter((f) => !f.showIf || f.showIf(form));

  const set = (f) => (e) => {
    let v = f.type === 'toggle' ? e : e.target.value;
    if (f.mask) v = f.mask(v);
    setForm((cur) => ({ ...cur, [f.key]: v }));
    setErrors((er) => ({ ...er, [f.key]: undefined }));
  };

  const submit = async () => {
    const missing = visible.filter((f) => f.required && (form[f.key] === undefined || String(form[f.key]).trim() === ''));
    if (missing.length) {
      setErrors(Object.fromEntries(missing.map((f) => [f.key, 'Campo obrigatório'])));
      toast.show('MSG12'); // FE 3.1
      return;
    }
    const invalid = visible.filter((f) => f.validate && !f.validate(form[f.key]));
    if (invalid.length) {
      setErrors(Object.fromEntries(invalid.map((f) => [f.key, f.invalidText || 'Valor inválido'])));
      toast.show('MSG12');
      return;
    }
    setSaving(true);
    const res = await onSave(form);
    setSaving(false);
    if (res.ok) onClose();
    else if (res.error?.fields) {
      const text = res.error.code === 'MSG13' ? 'Já cadastrado' : 'Verifique este campo';
      setErrors(Object.fromEntries(res.error.fields.map((k) => [k, text])));
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      subtitle="Campos marcados com * são obrigatórios."
      footer={
        <div className="flex gap-2">
          {onInactivate && (
            <Button variant="danger" className="flex-1" onClick={onInactivate}>
              Inativar
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-[2]" onClick={submit} loading={saving}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((f) => {
          const common = { value: form[f.key] ?? '', onChange: set(f), invalid: !!errors[f.key], placeholder: f.placeholder };
          return (
            <div key={f.key} className={f.span === 2 || f.type === 'toggle' || f.type === 'textarea' ? 'md:col-span-2' : ''}>
              {f.type === 'toggle' ? (
                <Toggle id={`f-${f.key}`} checked={!!form[f.key]} onChange={set(f)} label={f.label} description={f.hint} />
              ) : (
                <Field label={f.label} required={f.required} error={errors[f.key]} hint={f.hint}>
                  {f.type === 'select' ? (
                    <Select {...common}>
                      <option value="">Selecione…</option>
                      {f.options.map((o) => (
                        <option key={o.value ?? o} value={o.value ?? o}>
                          {o.label ?? o}
                        </option>
                      ))}
                    </Select>
                  ) : f.type === 'textarea' ? (
                    <Textarea {...common} />
                  ) : (
                    <Input type={f.type || 'text'} inputMode={f.inputMode} {...common} />
                  )}
                </Field>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/** Página padrão de cadastro (UC02): listagem com busca, filtros por etiqueta, inclusão, edição e inativação. */
export default function RegistryPage({
  title,
  subtitle,
  tabs,
  entityLabel,
  items,
  searchText,
  row,
  tagsOf,
  filterTags,
  fields,
  emptyItem,
  save,
  setActive,
}) {
  const toast = useToast();
  const load = usePageLoad('MSG11'); // FE 1.1
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState(null);

  const list = useMemo(() => {
    const q = normalize(query);
    return items
      .filter((i) => showInactive || i.active)
      .filter((i) => !q || normalize(searchText(i)).includes(q))
      .filter((i) => !tagsOf || matchesAllTags(tagsOf(i), selectedTags));
  }, [items, query, selectedTags, showInactive, searchText, tagsOf]);

  const inactivate = async (item) => {
    if (!(await toast.confirm('MSG09', { confirmLabel: 'Inativar' }))) return;
    const res = await setActive(item.id, false);
    if (res.ok) setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button icon={Plus} onClick={() => setEditing({ ...emptyItem })}>
            Adicionar Novo
          </Button>
        }
      >
        {tabs && <RouteTabs tabs={tabs} className="md:max-w-md" />}
      </PageHeader>

      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG11" onRetry={load.reload} />
      ) : (
        <>
          <div className="mb-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
                <Input className="pl-10" placeholder={`Pesquisar ${entityLabel.toLowerCase()}…`} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="sm:w-56">
                <Toggle id="show-inactive" checked={showInactive} onChange={setShowInactive} label="Mostrar inativos" />
              </div>
            </div>
            {filterTags && <TagFilter tags={filterTags} selected={selectedTags} onChange={setSelectedTags} />}
          </div>

          <p className="mb-3 text-[12.5px] text-muted">{list.length} registro(s)</p>

          {list.length === 0 ? (
            <EmptyState
              code={selectedTags.length ? 'MSG21' : undefined}
              text={selectedTags.length ? undefined : 'Nenhum registro encontrado.'}
              action={
                (selectedTags.length > 0 || query) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedTags([]);
                      setQuery('');
                    }}
                  >
                    {formatMessage('MSG22')}
                  </Button>
                )
              }
            />
          ) : (
            <Card className="divide-y divide-line/70 overflow-hidden">
              {list.map((item) => {
                const r = row(item);
                return (
                  <div key={item.id} className={`list-row ${item.active ? '' : 'opacity-60'}`}>
                    <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditing(item)}>
                      {r.leading}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink">{r.title}</span>
                        <span className="block truncate text-[12.5px] text-muted">{r.subtitle}</span>
                        {r.badges?.length > 0 && (
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            {r.badges.filter(Boolean).map((b) => (
                              <Badge key={b}>{b}</Badge>
                            ))}
                          </span>
                        )}
                      </span>
                      {r.trailing && <span className="hidden text-right text-[12.5px] text-muted sm:block">{r.trailing}</span>}
                    </button>
                    {item.active ? (
                      <Button size="sm" variant="ghost" className="hidden md:inline-flex" onClick={() => inactivate(item)}>
                        Inativar
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => setActive(item.id, true)}>
                        Reativar
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted/50" />
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}

      {editing && (
        <EntityForm
          title={editing.id ? `Editar ${entityLabel.toLowerCase()}` : `Novo ${entityLabel.toLowerCase()}`}
          fields={fields}
          initial={editing}
          onSave={save}
          onClose={() => setEditing(null)}
          onInactivate={editing.id && editing.active ? () => inactivate(editing) : undefined}
        />
      )}
    </div>
  );
}
