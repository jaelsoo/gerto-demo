import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { formatMessage, messageTone } from '../constants/messages';

/**
 * Feedback visual estilo iOS: banners (toasts) e alertas de confirmação.
 * Todo texto exibido vem do dicionário oficial src/constants/messages.js.
 */
const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-teal dark:text-sage' },
  error: { icon: XCircle, cls: 'text-red-600 dark:text-red-400' },
  warning: { icon: AlertTriangle, cls: 'text-amber-600 dark:text-amber-400' },
  info: { icon: Info, cls: 'text-petrol dark:text-mint' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const recent = useRef(new Map());

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  /** Exibe a mensagem oficial `code`. Ignora repetições idênticas em curto intervalo. */
  const show = useCallback(
    (code, params = {}, opts = {}) => {
      const text = formatMessage(code, params);
      const key = `${code}|${text}`;
      const last = recent.current.get(key);
      if (last && Date.now() - last < 1200) return;
      recent.current.set(key, Date.now());
      const id = Math.random().toString(36).slice(2);
      const tone = opts.tone || messageTone(code);
      setToasts((list) => [...list.slice(-3), { id, code, text, tone }]);
      setTimeout(() => dismiss(id), opts.duration || (tone === 'error' ? 6500 : 4000));
    },
    [dismiss],
  );

  /** Alerta de confirmação (ex.: [MSG09]). Resolve true/false. */
  const confirm = useCallback(
    (code, { confirmLabel = 'Confirmar', destructive = true, params } = {}) =>
      new Promise((resolve) => {
        setDialog({ text: formatMessage(code, params), code, confirmLabel, destructive, resolve });
      }),
    [],
  );

  const closeDialog = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const value = useMemo(() => ({ show, confirm }), [show, confirm]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)]" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, cls } = TONES[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-md animate-toast-in items-start gap-3 rounded-2xl border border-line/70 bg-card/90 px-4 py-3 shadow-card backdrop-blur-xl"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cls}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-ink">{t.text}</p>
                <p className="mt-0.5 text-[11px] text-muted">{t.code}</p>
              </div>
              <button onClick={() => dismiss(t.id)} className="rounded-full p-1 text-muted hover:bg-surface" aria-label="Fechar aviso">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6 animate-fade-in" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-xs animate-pop-in overflow-hidden rounded-2xl bg-card/95 text-center shadow-sheet backdrop-blur-xl">
            <div className="px-5 pb-4 pt-5">
              <p className="text-[15px] font-semibold text-ink">{dialog.text}</p>
              <p className="mt-1 text-[11px] text-muted">{dialog.code}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-line">
              <button className="border-r border-line py-3 text-[15px] text-primary dark:text-mint" onClick={() => closeDialog(false)}>
                Cancelar
              </button>
              <button
                autoFocus
                className={`py-3 text-[15px] font-semibold ${dialog.destructive ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-mint'}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
