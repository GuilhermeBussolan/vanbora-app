/** Dias corridos entre hoje e uma data ISO "yyyy-MM-dd" (positivo = data no passado). */
export function daysBetween(iso: string): number {
  const due = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - due.getTime()) / 86400000);
}
