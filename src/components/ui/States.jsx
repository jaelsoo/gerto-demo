import { Component } from 'react';
import { AlertTriangle, CheckCircle2, Info, RefreshCw, SearchX, XCircle } from 'lucide-react';
import { formatMessage, messageTone } from '../../constants/messages';
import { Button, Spinner, cx } from './primitives';

/** Estado vazio. Use `code` para mensagens oficiais (ex.: MSG19, MSG21) ou `text` para rótulos de interface. */
export function EmptyState({ code, text, icon: Icon = SearchX, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-10 text-center', className)}>
      <Icon className="mb-3 h-9 w-9 text-muted/60" aria-hidden />
      <p className="max-w-sm text-[14px] text-muted">{code ? formatMessage(code) : text}</p>
      {code && <p className="mt-1 text-[11px] text-muted/70">{code}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Falha de carregamento com botão "Tentar novamente" (fluxos de exceção FE 1.1). */
export function ErrorState({ code, onRetry, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/5 px-6 py-10 text-center', className)}>
      <XCircle className="mb-3 h-9 w-9 text-red-500" aria-hidden />
      <p className="max-w-sm text-[14px] font-medium text-ink">{formatMessage(code)}</p>
      <p className="mt-1 text-[11px] text-muted">{code}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Carregando…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[14px] text-muted">
      <Spinner /> {label}
    </div>
  );
}

const ALERT = {
  error: { icon: XCircle, cls: 'border-red-500/30 bg-red-500/[.07] text-red-700 dark:text-red-300' },
  warning: { icon: AlertTriangle, cls: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200' },
  info: { icon: Info, cls: 'border-petrol/25 bg-petrol/10 text-petrol dark:text-sand' },
  success: { icon: CheckCircle2, cls: 'border-teal/30 bg-teal/10 text-[#2f5b45] dark:text-sage' },
};

/** Alerta inline estilo iOS para mensagens oficiais. */
export function InlineAlert({ code, params, tone, children, className }) {
  const t = tone || messageTone(code);
  const { icon: Icon, cls } = ALERT[t];
  return (
    <div className={cx('flex gap-3 rounded-2xl border px-4 py-3 text-[13.5px]', cls, className)} role={t === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {code && (
          <p className="font-medium leading-snug">
            {formatMessage(code, params)} <span className="text-[11px] font-normal opacity-70">({code})</span>
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

/** Captura falhas de renderização e exibe a mensagem oficial correspondente (ex.: MSG36, MSG54). */
export class RenderBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.failed) {
      return <ErrorState code={this.props.code} onRetry={() => this.setState({ failed: false })} />;
    }
    return this.props.children;
  }
}
