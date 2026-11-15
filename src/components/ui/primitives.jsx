// Componentes base reutilizáveis (botões, campos, badges, controles segmentados).
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
  secondary: 'bg-teal/15 text-petrol hover:bg-teal/25 dark:bg-teal/20 dark:text-sage dark:hover:bg-teal/30',
  ghost: 'text-petrol hover:bg-surface dark:text-mint',
  outline: 'border border-line bg-card text-ink hover:bg-surface dark:bg-surface/60',
  danger: 'bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400',
  whatsapp: 'bg-[#25D366] text-white hover:bg-[#1fbe5b] shadow-sm',
};
const SIZES = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-12 px-5 text-[16px] gap-2',
  icon: 'h-10 w-10 justify-center',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-[18px] w-[18px]" aria-hidden />}
      {children}
    </button>
  );
});

export function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cx('card', className)} {...props}>
      {children}
    </Tag>
  );
}

const BADGE_TONES = {
  Agendado: 'bg-petrol/10 text-petrol dark:bg-petrol/30 dark:text-sand',
  'Em Andamento': 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Concluído: 'bg-sage/35 text-[#2f5b45] dark:bg-mint/20 dark:text-sage',
  Cancelado: 'bg-red-500/10 text-red-600 dark:text-red-400',
  'Frota Própria': 'bg-teal/15 text-[#3d756b] dark:text-mint',
  Terceirizada: 'bg-sand/60 text-[#6b6447] dark:bg-sand/15 dark:text-sand',
  VIP: 'bg-[#50808E] text-white',
  Sigilo: 'bg-zinc-800 text-white dark:bg-sand dark:text-zinc-900',
  Pendente: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Enviado: 'bg-petrol/10 text-petrol dark:bg-petrol/30 dark:text-sand',
  Assinado: 'bg-sage/35 text-[#2f5b45] dark:bg-mint/20 dark:text-sage',
  Emitida: 'bg-sage/35 text-[#2f5b45] dark:bg-mint/20 dark:text-sage',
  Inativo: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
  receita: 'bg-sage/35 text-[#2f5b45] dark:bg-mint/20 dark:text-sage',
  despesa: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export function Badge({ children, tone, className }) {
  const key = tone || children;
  return (
    <span
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold',
        BADGE_TONES[key] || 'bg-surface text-muted dark:bg-surface',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Field({ label, required, error, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && (
        <span className="label">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] font-medium text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

export const Input = forwardRef(function Input({ invalid, className, ...props }, ref) {
  return <input ref={ref} className={cx('input', invalid && 'input-error', className)} {...props} />;
});

export function Select({ invalid, className, children, ...props }) {
  return (
    <select className={cx('input appearance-none bg-[length:16px] pr-9', invalid && 'input-error', className)} {...props}>
      {children}
    </select>
  );
}

export const Textarea = forwardRef(function Textarea({ invalid, className, ...props }, ref) {
  return <textarea ref={ref} className={cx('input min-h-[96px] resize-y leading-relaxed', invalid && 'input-error', className)} {...props} />;
});

export function Toggle({ checked, onChange, label, description, id }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block text-[15px] text-ink">{label}</span>
        {description && <span className="block text-[12.5px] text-muted">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-[31px] w-[51px] rounded-full bg-zinc-300 transition peer-checked:bg-teal dark:bg-zinc-600 peer-focus-visible:ring-2 peer-focus-visible:ring-teal/50" />
        <span className="absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Controle segmentado estilo iOS. options: [{ value, label }] */
export function Segmented({ options, value, onChange, className }) {
  return (
    <div className={cx('inline-flex w-full rounded-xl bg-surface p-1 dark:bg-surface', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 whitespace-nowrap rounded-[10px] px-3 py-1.5 text-[13px] font-semibold transition',
            value === o.value ? 'bg-card text-ink shadow-sm dark:bg-line' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, children, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition',
        active ? 'border-transparent bg-primary text-white' : 'border-line bg-card text-ink hover:bg-surface dark:bg-surface/60',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Avatar({ name, className }) {
  const letters = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span className={cx('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal to-petrol text-[14px] font-semibold text-white', className)}>
      {letters}
    </span>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx('h-5 w-5 animate-spin text-teal', className)} />;
}
