import { useRef, useState } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';

/** Gesto "puxar para atualizar" (UC11 CA 3.1 / UC15 CA 3.1) para telas sensíveis ao toque. */
export default function PullToRefresh({ onRefresh, children }) {
  const start = useRef(null);
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const THRESHOLD = 70;

  const onTouchStart = (e) => {
    start.current = window.scrollY <= 0 && !busy ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e) => {
    if (start.current === null) return;
    const delta = e.touches[0].clientY - start.current;
    setPull(delta > 0 ? Math.min(delta * 0.5, 110) : 0);
  };
  const onTouchEnd = async () => {
    if (start.current === null) return;
    start.current = null;
    if (pull >= THRESHOLD) {
      setBusy(true);
      setPull(56);
      await onRefresh();
      setBusy(false);
    }
    setPull(0);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="flex items-end justify-center overflow-hidden transition-[height] duration-200" style={{ height: pull }} aria-hidden={!pull}>
        <div className="mb-3 flex items-center gap-2 text-[12px] text-muted">
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-teal" /> : <ArrowDown className={`h-4 w-4 transition ${pull >= THRESHOLD ? 'rotate-180' : ''}`} />}
          {busy ? 'Atualizando…' : pull >= THRESHOLD ? 'Solte para atualizar' : 'Puxe para atualizar'}
        </div>
      </div>
      {children}
    </div>
  );
}
