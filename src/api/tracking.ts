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

/** [Responsável] Posição atual do transportador contratado + paradas. */
export function getGuardianTracking(token: string): Promise<GuardianTracking> {
  return apiFetch<GuardianTracking>('/api/guardians/me/tracking', { token });
}
