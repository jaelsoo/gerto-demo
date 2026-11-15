import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './primitives';

/**
 * Modal adaptativo: bottom sheet deslizante no smartphone e diálogo centralizado no tablet/desktop.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: 'md:max-w-md', md: 'md:max-w-xl', lg: 'md:max-w-3xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-bg shadow-sheet animate-sheet-up md:animate-pop-in md:rounded-3xl',
          width,
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <header className="flex items-start gap-3 border-b border-line/70 px-5 pb-3 pt-3 md:pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full bg-surface p-1.5 text-muted hover:text-ink" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-line/70 bg-bg/95 px-5 py-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
