import { HireRequestDto } from '@/types';
import { apiFetch } from './client';

/** Perfil do responsável exibido ao transportador ao abrir uma solicitação. */
export interface GuardianForTransporterDto {
  guardianId: number;
  name: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  bio: string | null;
  /** ISO de quando o responsável entrou no app. */
  memberSince: string;
  pickupNeighborhood: string | null;
  studentName: string;
  dropoffSchool: string;
  dependentsCount: number;
}

/** [Transportador] Perfil do responsável de uma solicitação recebida. */
export function getGuardianForRequest(
  token: string,
  hireRequestId: number,
): Promise<GuardianForTransporterDto> {
  return apiFetch<GuardianForTransporterDto>(`/api/hire-requests/${hireRequestId}/guardian`, { token });
}

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

/** [Responsável] Cancela a própria solicitação pendente (some da tela do transportador). */
export function cancelHireRequest(token: string, hireRequestId: number): Promise<void> {
  return apiFetch<void>(`/api/hire-requests/${hireRequestId}/cancel`, { method: 'POST', token });
}

/** [Responsável] Dispensa o aviso de uma solicitação recusada na home. */
export function dismissHireRequest(token: string, hireRequestId: number): Promise<void> {
  return apiFetch<void>(`/api/hire-requests/${hireRequestId}/dismiss`, { method: 'POST', token });
}
