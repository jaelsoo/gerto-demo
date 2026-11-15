import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Toggle } from '../ui/primitives';
import { formatMessage } from '../../constants/messages';

/** Indicador de sincronização (UC09) com atalho para "Simular Offline" e falha de servidor. */
export default function SyncIndicator() {
  const { sync, offline, net, setNetwork, refresh } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const status = offline ? 'offline' : sync.status;
  const view = {
    synced: { icon: Cloud, label: 'Sincronizado', cls: 'text-teal dark:text-sage', dot: 'bg-teal' },
    syncing: { icon: Loader2, label: 'Sincronizando…', cls: 'text-petrol dark:text-mint', dot: 'bg-petrol', spin: true },
    offline: { icon: CloudOff, label: 'Offline', cls: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    error: { icon: AlertTriangle, label: 'Falha na sincronização', cls: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  }[status];
  const Icon = view.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line/70 bg-card/70 px-3 text-[12.5px] font-medium text-ink hover:bg-surface"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Status de sincronização"
      >
        <span className={`relative flex h-2 w-2`}>
          {status === 'synced' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${view.dot}`} />}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${view.dot}`} />
        </span>
        <Icon className={`h-4 w-4 ${view.cls} ${view.spin ? 'animate-spin' : ''}`} aria-hidden />
        <span className="hidden sm:inline">{view.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[300px] animate-pop-in rounded-2xl border border-line bg-card p-4 shadow-sheet" role="dialog">
          <p className="text-[15px] font-semibold text-ink">Sincronização</p>
          <p className="mt-1 text-[12.5px] text-muted">
            {status === 'offline'
              ? formatMessage('MSG28')
              : status === 'error'
                ? formatMessage('MSG29')
                : `Última sincronização: ${new Date(sync.at).toLocaleTimeString('pt-BR')}`}
          </p>
          <div className="mt-4 space-y-4">
            <Toggle id="sim-offline" checked={net.offline} onChange={(v) => setNetwork({ offline: v })} label="Simular Offline" description="Testa os fluxos sem conexão (MSG02, MSG28…)." />
            <Toggle id="sim-sync" checked={net.syncFail} onChange={(v) => setNetwork({ syncFail: v })} label="Simular falha do servidor" description="Salva localmente e alerta falha de propagação (MSG29)." />
          </div>
          <button
            onClick={refresh}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface py-2 text-[13px] font-semibold text-petrol dark:text-mint"
          >
            <RefreshCw className="h-4 w-4" /> Sincronizar agora
          </button>
          <p className="mt-3 text-[11px] leading-snug text-muted">
            Demonstração: a sincronização ocorre entre abas do mesmo navegador (evento <code>storage</code>). Não há sincronização real entre dispositivos.
          </p>
        </div>
      )}
    </div>
  );
}
