import { Filter, X } from 'lucide-react';
import { formatMessage } from '../../constants/messages';
import { Chip } from './primitives';

/**
 * Filtro por etiquetas (UC06). Seleção múltipla com lógica "E" (todas as tags marcadas)
 * e atalho oficial para limpar filtros ([MSG22]).
 */
export default function TagFilter({ tags, selected, onChange }) {
  const toggle = (tag) => onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      <div className="scrollbar-none -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-0.5">
        {tags.map((t) => (
          <Chip key={t} active={selected.includes(t)} onClick={() => toggle(t)}>
            {t}
          </Chip>
        ))}
      </div>
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          title={formatMessage('MSG22')}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium text-petrol hover:bg-surface dark:text-mint"
        >
          <X className="h-4 w-4" /> Limpar
        </button>
      )}
    </div>
  );
}
