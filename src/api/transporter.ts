/** Perfil do transportador: próprio (edição) e público (visto pelo responsável). */
import { TransporterDetailDto, TransporterProfileDto, TransporterSummaryDto } from '@/types';
import { apiFetch, apiUpload, UploadFile } from './client';

/** Busca de transportadores por escola/bairro, ordenável por preço ou avaliação. */
export function searchTransporters(
  token: string,
  params: { school?: string; neighborhood?: string; sort?: 'price' | 'rating' } = {},
): Promise<TransporterSummaryDto[]> {
  const qs = new URLSearchParams();
  if (params.school) qs.set('school', params.school);
  if (params.neighborhood) qs.set('neighborhood', params.neighborhood);
  if (params.sort) qs.set('sort', params.sort);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<TransporterSummaryDto[]>(`/api/transporters${suffix}`, { token });
}

export function getMyProfile(token: string): Promise<TransporterProfileDto> {
  return apiFetch<TransporterProfileDto>('/api/transporters/me', { token });
}

export function getPublicProfile(token: string, id: number): Promise<TransporterDetailDto> {
  return apiFetch<TransporterDetailDto>(`/api/transporters/${id}`, { token });
}

export function updateVehicle(
  token: string,
  body: { cnh: string | null; plate: string | null; capacity: number | null },
): Promise<TransporterProfileDto> {
  return apiFetch<TransporterProfileDto>('/api/transporters/me', { method: 'PUT', body, token });
}

export function updateServiceArea(
  token: string,
  body: { schools: string[]; neighborhoods: string[] },
): Promise<TransporterProfileDto> {
  return apiFetch<TransporterProfileDto>('/api/transporters/me/service-area', {
    method: 'PUT',
    body,
    token,
  });
}

export function updatePricing(
  token: string,
  body: { baseMonthlyFee: number; acceptsProposals: boolean },
): Promise<TransporterProfileDto> {
  return apiFetch<TransporterProfileDto>('/api/transporters/me/pricing', {
    method: 'PUT',
    body,
    token,
  });
}

export function uploadMyPhoto(token: string, file: UploadFile): Promise<TransporterProfileDto> {
  return apiUpload<TransporterProfileDto>('/api/transporters/me/photo', file, token);
}
