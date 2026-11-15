import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePageLoad } from '../../hooks/usePageLoad';
import { renderTemplate, templateVariables } from '../../utils/rules';
import { formatDate } from '../../utils/format';
import Sheet from '../ui/Sheet';
import { Button, Field, Select } from '../ui/primitives';
import { ErrorState, LoadingState } from '../ui/States';

/** UC13 — CA 3.2: utilizar um template em um atendimento e gerar o contrato preenchido. */
function Inner({ onClose, serviceId: initialService, templateId: initialTemplate }) {
  const { db, actions } = useData();
  const navigate = useNavigate();
  const load = usePageLoad('MSG45'); // FE 3.3 — falha ao carregar template selecionado
  const [serviceId, setServiceId] = useState(initialService ? String(initialService) : '');
  const [templateId, setTemplateId] = useState(initialTemplate || '');
  const [saving, setSaving] = useState(false);

  const service = db.services.find((s) => String(s.id) === String(serviceId));
  const template = db.templates.find((t) => t.id === templateId && t.active);
  const preview = useMemo(() => (service && template ? renderTemplate(template.body, templateVariables(service, db)) : ''), [service, template, db]);
  const services = [...db.services].filter((s) => s.status !== 'Cancelado').sort((a, b) => b.date.localeCompare(a.date));

  const generate = async () => {
    setSaving(true);
    const res = await actions.createContract(service.id, template.id);
    setSaving(false);
    if (res.ok) {
      onClose();
      navigate(`/contratos/${res.result.id}`);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Utilizar Modelo"
      subtitle="Gera um contrato preenchido com os dados do serviço."
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-[2]" icon={FileSignature} disabled={!service || !template || !!load.error} loading={saving} onClick={generate}>
            Gerar contrato
          </Button>
        </div>
      }
    >
      {load.loading ? (
        <LoadingState />
      ) : load.error ? (
        <ErrorState code="MSG45" onRetry={load.reload} />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Template" required>
              <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <option value="">Selecione o modelo…</option>
                {db.templates
                  .filter((t) => t.active)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Serviço vinculado" required>
              <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Selecione o serviço…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    nº {s.id} — {formatDate(s.date)} — {db.clients.find((c) => c.id === s.clientId)?.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {preview ? (
            <div>
              <p className="label">Pré-visualização</p>
              <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-card p-4 font-serif text-[13.5px] leading-relaxed text-ink">{preview}</pre>
            </div>
          ) : (
            <p className="text-[13px] text-muted">Selecione o template e o serviço para visualizar o documento preenchido.</p>
          )}
        </div>
      )}
    </Sheet>
  );
}

export default function GenerateContractSheet({ open, ...props }) {
  if (!open) return null;
  return <Inner {...props} />;
}
