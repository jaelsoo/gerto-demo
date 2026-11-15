import { useMemo, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { buildServiceSummary, whatsappUrl } from '../../utils/rules';
import Sheet from '../ui/Sheet';
import { Button, Toggle } from '../ui/primitives';
import { ErrorState } from '../ui/States';

/**
 * UC07 — Pré-visualização do resumo padronizado do serviço.
 * O compartilhamento abre o WhatsApp com o texto preenchido; o envio depende do gestor (sem disparo automático).
 */
export default function SummarySheet({ open, onClose, service }) {
  const { db } = useData();
  const { user } = useAuth();
  const client = db.clients.find((c) => c.id === service?.clientId);
  const [includeValue, setIncludeValue] = useState(false);
  const [discreet, setDiscreet] = useState(Boolean(client?.discreet));
  const [withCoordinator, setWithCoordinator] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!open) return { text: '' };
    try {
      return { text: buildServiceSummary(service, db, { includeValue, discreet, coordinator: withCoordinator ? user : null }) };
    } catch {
      return { error: 'MSG24' }; // FE 3.1
    }
  }, [open, service, db, includeValue, discreet, withCoordinator, user]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result.text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const footer = result.error ? null : (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="outline" className="flex-1" onClick={onClose}>
        Cancelar
      </Button>
      <Button variant="secondary" className="flex-1" icon={copied ? Check : Copy} onClick={copy}>
        {copied ? 'Texto copiado' : 'Copiar texto'}
      </Button>
      <Button
        variant="whatsapp"
        className="flex-1"
        icon={MessageCircle}
        onClick={() => window.open(whatsappUrl(result.text), '_blank', 'noopener,noreferrer')}
      >
        Compartilhar
      </Button>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Resumo do serviço" subtitle={service ? `Serviço nº ${service.id} — pré-visualização` : ''} footer={footer}>
      {result.error ? (
        <ErrorState code={result.error} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#e7ddd0] p-3 dark:bg-[#0b141a]">
            <div className="ml-auto max-w-[95%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-[#d9fdd3] px-3.5 py-2.5 font-sans text-[13.5px] leading-relaxed text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
              {result.text}
            </div>
          </div>
          <Toggle id="sum-value" checked={includeValue} onChange={setIncludeValue} label="Incluir valor do serviço" description="Desative ao enviar para motoristas e parceiros." />
          <Toggle
            id="sum-discreet"
            checked={discreet}
            onChange={setDiscreet}
            label="Modo sigiloso"
            description={client?.discreet ? 'Ativado por padrão: este cliente exige sigilo. Oculta cliente e passageiro.' : 'Oculta o nome do cliente e do passageiro.'}
          />
          <Toggle id="sum-coord" checked={withCoordinator} onChange={setWithCoordinator} label="Incluir contato da coordenação" description={`${user?.name || ''}${user?.phone ? ` — ${user.phone}` : ''}`} />
          <p className="text-[12px] text-muted">
            "Compartilhar" abre o WhatsApp (wa.me) com o texto preenchido para você escolher o destinatário. Nenhuma mensagem é enviada automaticamente.
          </p>
        </div>
      )}
    </Sheet>
  );
}
