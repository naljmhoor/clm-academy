const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "14 Jul 2026 · 09:12" */
export function fmtDateTime(isoStr?: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "01 Jan 2026" */
export function fmtDate(isoStr?: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return isoStr;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "29/08/2026 14:55" — comment timestamps. */
export function fmtCommentTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtMoney(n?: number): string {
  if (n === undefined) return '-';
  return `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

export function fmtSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

export function fileExt(name: string): string {
  return (name.split('.').pop() ?? '').toUpperCase();
}
