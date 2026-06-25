import { HireRequestDto } from '@/types';
import { apiFetch } from './client';

/** [Responsável] Envia uma solicitação de contratação (com proposta de valor opcional). */
export function createHireRequest(
  token: string,
  body: { transporterId: number; dependentId: number; proposedFee?: number | null },
): Promise<HireRequestDto> {
  return apiFetch<HireRequestDto>('/api/hire-requests', { method: 'POST', body, token });
}

/** [Transportador] Solicitações de contratação pendentes, com dados do responsável. */
export function listHireRequests(token: string): Promise<HireRequestDto[]> {
  return apiFetch<HireRequestDto[]>('/api/transporters/me/hire-requests', { token });
}

/** [Transportador] Libera o contrato (aceita) — notifica o responsável para assinar. */
export function releaseContract(token: string, hireRequestId: number): Promise<void> {
  return apiFetch<void>(`/api/hire-requests/${hireRequestId}/accept`, { method: 'POST', token });
}

/** [Transportador] Recusa a solicitação. */
export function rejectHireRequest(token: string, hireRequestId: number): Promise<void> {
  return apiFetch<void>(`/api/hire-requests/${hireRequestId}/reject`, { method: 'POST', token });
}
