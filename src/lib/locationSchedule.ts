/**
 * Regras da agenda de compartilhamento de localização. Determina se, no momento,
 * o transportador deve estar compartilhando (interruptor mestre + janelas), e
 * descreve a próxima janela. Tudo em horário local do aparelho.
 */
import { LocationSharingDto, LocationWindowDto } from '@/types';

/** Nomes curtos dos dias (índice = dayOfWeek ISO: 1=seg…7=dom). */
export const WEEKDAY_SHORT = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** JS getDay() (0=dom…6=sáb) → ISO (1=seg…7=dom). */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m);
}

/** true se, agora, a localização deve ser compartilhada. Sem janelas + ligado = sempre. */
export function isSharingActiveNow(sharing: LocationSharingDto | null, now = new Date()): boolean {
  if (!sharing?.enabled) return false;
  if (sharing.windows.length === 0) return true;
  const day = isoWeekday(now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  return sharing.windows.some(
    (w) => w.dayOfWeek === day && minutes >= toMinutes(w.startTime) && minutes < toMinutes(w.endTime),
  );
}

/** Descreve a próxima janela a partir de agora (ex.: "Seg 06:00"), ou null. */
export function describeNextWindow(
  sharing: LocationSharingDto | null,
  now = new Date(),
): string | null {
  if (!sharing?.enabled || sharing.windows.length === 0) return null;
  const nowDay = isoWeekday(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let best: { inDays: number; startMin: number; window: LocationWindowDto } | null = null;
  for (const w of sharing.windows) {
    // Distância em dias até a próxima ocorrência deste dia da semana.
    let inDays = (w.dayOfWeek - nowDay + 7) % 7;
    if (inDays === 0 && toMinutes(w.startTime) <= nowMin) inDays = 7; // já passou hoje
    const startMin = inDays * 24 * 60 + toMinutes(w.startTime);
    if (best == null || startMin < best.startMin) {
      best = { inDays, startMin, window: w };
    }
  }
  if (!best) return null;
  const prefix = best.inDays === 0 ? 'hoje' : WEEKDAY_SHORT[best.window.dayOfWeek];
  return `${prefix} ${best.window.startTime}`;
}
