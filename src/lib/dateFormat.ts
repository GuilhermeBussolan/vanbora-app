const p = (n: number) => String(n).padStart(2, '0');

/** Instante ISO → "24/09/2026" (fuso do aparelho). */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Instante ISO → "18:42" (fuso do aparelho). */
export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
