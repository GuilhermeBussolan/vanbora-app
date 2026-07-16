/** Config pública do app (taxas do VanBora). */
import { FeesDto } from '@/types';
import { apiFetch } from './client';

/** Taxas usadas nas prévias de mensalidade líquida, multa e reembolso. */
export function getFees(token?: string | null): Promise<FeesDto> {
  return apiFetch<FeesDto>('/api/config/fees', { token });
}
