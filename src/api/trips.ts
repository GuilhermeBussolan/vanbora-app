import { TripDto, TripRunDto } from '@/types';
import { apiFetch } from './client';

export interface TripInput {
  name: string;
  /** Ids dos ajudantes (com acesso de monitor) escalados. */
  monitorIds: number[];
  /** true = todos os alunos ativos (inclusive os que forem contratados depois). */
  allStudents: boolean;
  /** Ids dos dependentes quando `allStudents` é falso. */
  studentIds: number[];
}

/** Percursos visíveis ao usuário (transportador: todos; monitor: os escalados). */
export function listTrips(token: string): Promise<TripDto[]> {
  return apiFetch<TripDto[]>('/api/trips', { token });
}

/** [Transportador] Cria um percurso. */
export function createTrip(token: string, body: TripInput): Promise<TripDto> {
  return apiFetch<TripDto>('/api/transporters/me/trips', { method: 'POST', body, token });
}

/** [Transportador] Edita nome, monitores e alunos do percurso. */
export function updateTrip(token: string, id: number, body: TripInput): Promise<TripDto> {
  return apiFetch<TripDto>(`/api/transporters/me/trips/${id}`, { method: 'PUT', body, token });
}

/** [Transportador] Exclui (desativa) o percurso; o histórico permanece. */
export function deleteTrip(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/trips/${id}`, { method: 'DELETE', token });
}

/** Inicia o percurso de hoje. */
export function startTrip(token: string, tripId: number): Promise<TripRunDto> {
  return apiFetch<TripRunDto>(`/api/trips/${tripId}/runs`, { method: 'POST', token });
}

/** Encerra o percurso — abre o checklist de segurança pós-percurso. */
export function finishTripRun(token: string, runId: number): Promise<TripRunDto> {
  return apiFetch<TripRunDto>(`/api/trip-runs/${runId}/finish`, { method: 'POST', token });
}

/** Cancela um percurso em andamento (não ocorreu): não gera checklist. */
export function cancelTripRun(token: string, runId: number): Promise<TripRunDto> {
  return apiFetch<TripRunDto>(`/api/trip-runs/${runId}/cancel`, { method: 'POST', token });
}
