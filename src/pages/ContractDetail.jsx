import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Fingerprint, Paperclip, Printer, Send, ShieldCheck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageLoad } from '../hooks/usePageLoad';
import { authService } from '../services/auth';
import { sha256 } from '../utils/crypto';
import { formatDate, formatDateTime } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import Sheet from '../components/ui/Sheet';
import { Badge, Button, Card, Field, Input } from '../components/ui/primitives';
import { ErrorState, InlineAlert, LoadingState } from '../components/ui/States';

const MAX_INLINE_FILE = 300 * 1024; // anexos maiores guardam apenas os metadados (limite do localStorage)

/** UC14 — confirmação da assinatura eletrônica (simulada) com autenticação por senha. */
function SignSheet({ contract, onClose }) {
  const { user } = useAuth();
  const { actions } = useData();
  const [agree, setAgree] = useState(false);
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const sign = async () => {
    setFailed(false);
    if (!authService.verifyPassword(user.id, password)) {
      setFailed(true);
      return;
    }
    setBusy(true);
    const at = new Date().toISOString();
    const hash = await sha256(`${contract.id}|${contract.content}|${user.email}|${at}`);
    const res = await actions.signContract(contract.id, {
      signer: user.name,
      signerEmail: user.email,
      at,
      hash,
      method: 'Assinatura eletrônica simulada (senha do usuário)',
      userAgent: navigator.userAgent.slice(0, 120),
    });
    setBusy(false);
    if (res.ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Assinar Eletronicamente"
      subtitle={`${contract.number} — ${contract.title}`}
      size="sm"
      footer={
        <div className="flex gap-2">
          {/* CA 3.2 — cancelar mantém o status original */}
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-[2]" icon={Fingerprint} disabled={!agree || !password} loading={busy} onClick={sign}>
            Confirmar assinatura
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {failed && (
          <InlineAlert code="MSG49">
            <p className="mt-1 text-[12px] opacity-80">Senha de autenticação não confere.</p>
          </InlineAlert>
        )}
        <div className="rounded-2xl bg-surface p-4 text-[13px] text-ink">
          <p>
            Signatário: <strong>{user.name}</strong>
          </p>
          <p className="text-muted">{user.email}</p>
        </div>
        <label className="flex items-start gap-3 text-[13.5px] text-ink">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#50808E]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          Declaro que li o documento e concordo em assiná-lo eletronicamente.
        </label>
        <Field label="Confirme sua senha" required hint="Autenticação da assinatura.">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={failed} autoComplete="current-password" />
        </Field>
        <p className="text-[11.5px] leading-snug text-muted">
          Demonstração acadêmica: a assinatura registra data/hora e hash SHA-256 do conteúdo, mas não possui certificação digital nem validade jurídica.
        </p>
      </div>
    </Sheet>
  );
}

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { db, actions } = useData();
  const toast = useToast();
  const load = usePageLoad('MSG48', [id]); // FE 1.2
  const [signing, setSigning] = useState(false);
  const fileRef = useRef(null);
  const contract = db.contracts.find((c) => c.id === id);

  // FE 1.1 — contrato não encontrado
  useEffect(() => {
    if (!load.loading && !load.error && !contract) {
      toast.show('MSG47');
      navigate('/contratos', { replace: true });
    }
  }, [load.loading, load.error, contract, navigate, toast]);

  if (load.loading) return <LoadingState />;
  if (load.error) return <ErrorState code="MSG48" onRetry={load.reload} />;
  if (!contract) return null;

  const service = db.services.find((s) => s.id === contract.serviceId);
  const client = db.clients.find((c) => c.id === service?.clientId);
  const canSign = ['Pendente', 'Enviado'].includes(contract.status);

  const attach = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const meta = { name: file.name, size: file.size, type: file.type || 'application/octet-stream' };
    if (file.size > MAX_INLINE_FILE) {
      actions.addContractAttachment(contract.id, meta);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => actions.addContractAttachment(contract.id, { ...meta, dataUrl: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        back="/contratos"
        title={contract.number}
        subtitle={`${contract.title} · ${client?.name || '—'}`}
        actions={
          <>
            {contract.status === 'Pendente' && (
              <Button variant="outline" icon={Send} onClick={() => actions.updateContractStatus(contract.id, 'Enviado', 'Enviado ao cliente para conferência.')}>
                Marcar como enviado
              </Button>
            )}
            {canSign && (
              <Button icon={Fingerprint} onClick={() => setSigning(true)}>
                Assinar Eletronicamente
              </Button>
            )}
            <Button variant="outline" icon={Printer} onClick={() => window.print()}>
              Imprimir / PDF
            </Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <Badge className="text-[13px]">{contract.status}</Badge>
          <span>Criado em {formatDateTime(contract.createdAt)}</span>
          {service && (
            <Link to={`/servicos/${service.id}`} className="font-medium text-petrol dark:text-mint">
              Serviço nº {service.id} ({formatDate(service.date)})
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="section-title">Documento</h2>
          <Card className="p-0">
            <div id="print-area" className="px-6 py-7 md:px-10 md:py-10">
              <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-[17px] font-bold text-petrol dark:text-mint">ROAS Transfer</p>
                  <p className="text-[11px] text-muted">Transporte Executivo e Receptivo</p>
                </div>
                <p className="text-right text-[11px] text-muted">
                  {contract.number}
                  <br />
                  Gerado pelo Gerto
                </p>
              </div>
              <pre className="whitespace-pre-wrap font-serif text-[14px] leading-relaxed text-ink">{contract.content}</pre>
              {contract.signature && (
                <div className="mt-8 rounded-xl border border-teal/40 bg-teal/5 p-4 text-[12px] text-ink">
                  <p className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-teal" /> Assinado eletronicamente por {contract.signature.signer}
                  </p>
                  <p className="mt-1 text-muted">
                    {contract.signature.signerEmail} · {formatDateTime(contract.signature.at)}
                  </p>
                  <p className="mt-1 break-all font-mono text-[10.5px] text-muted">SHA-256: {contract.signature.hash}</p>
                  <p className="mt-1 text-[10.5px] text-muted">{contract.signature.method}</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        <aside className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="section-title">Histórico de status</h2>
            <Card className="p-4">
              <ol className="relative space-y-4 border-l border-line pl-4">
                {[...contract.history].reverse().map((h, i) => (
                  <li key={i}>
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-teal" />
                    <div className="flex items-center gap-2">
                      <Badge>{h.status}</Badge>
                      <span className="text-[11.5px] text-muted">{formatDateTime(h.at)}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-ink">{h.note}</p>
                    <p className="text-[11.5px] text-muted">{h.user}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="section-title pb-0">Anexos</h2>
              <Button size="sm" variant="ghost" icon={Paperclip} onClick={() => fileRef.current?.click()}>
                Anexar arquivo
              </Button>
              <input ref={fileRef} type="file" className="hidden" onChange={attach} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
            </div>
            <Card className="divide-y divide-line/70">
              {contract.attachments.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">Nenhum anexo.</p>}
              {contract.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <Paperclip className="h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] text-ink">{a.name}</p>
                    <p className="text-[11.5px] text-muted">
                      {(a.size / 1024).toFixed(0)} KB · {formatDateTime(a.addedAt)} · {a.addedBy}
                    </p>
                  </div>
                  {a.dataUrl && (
                    <a href={a.dataUrl} download={a.name} className="rounded-lg p-1.5 text-petrol hover:bg-surface dark:text-mint" aria-label={`Baixar ${a.name}`}>
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </Card>
            <p className="mt-2 text-[11.5px] text-muted">Arquivos de até 300 KB ficam disponíveis para download; maiores são registrados apenas por metadados.</p>
          </section>
        </aside>
      </div>

      {signing && <SignSheet contract={contract} onClose={() => setSigning(false)} />}
    </div>
  );
}
