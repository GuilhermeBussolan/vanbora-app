import { ApiRouteStop, GuardianTracking } from '@/types';
import { apiFetch } from './client';

/** [Transportador] Paradas da rota do dia (com coordenadas). */
export function getMyRoute(token: string): Promise<ApiRouteStop[]> {
  return apiFetch<ApiRouteStop[]>('/api/transporters/me/route', { token });
}

/** [Transportador] Recalcula a melhor ordem das paradas e devolve a rota reordenada. */
export function optimizeMyRoute(token: string): Promise<ApiRouteStop[]> {
  return apiFetch<ApiRouteStop[]>('/api/transporters/me/route/optimize', {
    method: 'POST',
    token,
  });
}

/** [Transportador] Envia a posição GPS atual do aparelho. */
export function postMyLocation(
  token: string,
  latitude: number,
  longitude: number,
): Promise<{ latitude: number; longitude: number; updatedAt: string }> {
  return apiFetch('/api/transporters/me/location', {
    method: 'POST',
    body: { latitude, longitude },
    token,
  });
}

/** [Responsável] Posição atual do transportador do dependente + paradas. */
export function getGuardianTracking(
  token: string,
  dependentId?: number | null,
): Promise<GuardianTracking> {
  const q = dependentId != null ? `?dependentId=${dependentId}` : '';
  return apiFetch<GuardianTracking>(`/api/guardians/me/tracking${q}`, { token });
}
