// Exportação CSV real (UC15) — separador ";" e BOM UTF-8 para abrir corretamente no Excel em pt-BR.

const escapeCell = (value) => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** columns: [{ key, label, format? }] */
export function toCSV(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(';');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(c.format ? c.format(row[c.key], row) : row[c.key])).join(';'),
  );
  return [header, ...body].join('\r\n');
}

/** Valor numérico no formato brasileiro sem símbolo (ex.: 1234,50). */
export const csvNumber = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');

export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
