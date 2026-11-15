import { formatCurrency } from '../../utils/format';

/**
 * Gráfico de barras agrupadas em SVG puro (sem dependências).
 * data: [{ label, values: [n1, n2] }], series: [{ name, className }]
 */
export default function BarChart({ data, series, height = 200 }) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const W = 600;
  const H = height;
  const pad = { top: 12, bottom: 28, left: 8, right: 8 };
  const groupW = (W - pad.left - pad.right) / data.length;
  const barW = Math.min(26, (groupW - 16) / series.length);
  const scale = (v) => ((H - pad.top - pad.bottom) * v) / max;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Gráfico de receitas e despesas por mês">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad.left} x2={W - pad.right} y1={H - pad.bottom - (H - pad.top - pad.bottom) * f} y2={H - pad.bottom - (H - pad.top - pad.bottom) * f} className="stroke-line" strokeDasharray="3 4" />
        ))}
        {data.map((d, i) => {
          const gx = pad.left + i * groupW + (groupW - barW * series.length - 4 * (series.length - 1)) / 2;
          return (
            <g key={d.label}>
              {d.values.map((v, j) => {
                const h = scale(v);
                return (
                  <rect key={j} x={gx + j * (barW + 4)} y={H - pad.bottom - h} width={barW} height={Math.max(h, 1)} rx={5} className={series[j].className}>
                    <title>{`${series[j].name} — ${d.label}: ${formatCurrency(v)}`}</title>
                  </rect>
                );
              })}
              <text x={pad.left + i * groupW + groupW / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[12px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-[12px] text-muted">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden>
              <rect width="10" height="10" rx="3" className={s.className} />
            </svg>
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
