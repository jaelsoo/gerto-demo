import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Cabeçalho de página com título grande (Large Title, HIG) e ações à direita. */
export default function PageHeader({ title, subtitle, actions, back, children }) {
  const navigate = useNavigate();
  return (
    <div className="mb-5">
      {back && (
        <button
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-1.5 mb-1 inline-flex items-center gap-0.5 rounded-lg px-1 py-1 text-[15px] font-medium text-petrol hover:bg-surface dark:text-mint"
        >
          <ChevronLeft className="h-5 w-5" /> Voltar
        </button>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight text-ink md:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-1 text-[14px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
