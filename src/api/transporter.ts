/** Perfil do transportador: próprio (edição) e público (visto pelo responsável). */
import {
  SearchFiltersDto,
  TransporterDetailDto,
  TransporterProfileDto,
  TransporterSummaryDto,
} from '@/types';
import { apiFetch, apiUpload, UploadFile } from './client';

/** Escolas e bairros já cadastrados (autocompletes da busca), em ordem alfabética. */
export function getSearchFilters(token: string): Promise<SearchFiltersDto> {
  return apiFetch<SearchFiltersDto>('/api/transporters/filters', { token });
}

/** Busca de transportadores por escola/bairro, ordenável por preço ou avaliação. */
export function searchTransporters(
  token: string,
  params: {
    school?: string;
    neighborhood?: string;
    sort?: 'price' | 'rating';
    dir?: 'asc' | 'desc';
  } = {},
): Promise<TransporterSummaryDto[]> {
  const qs = new URLSearchParams();
  if (params.school) qs.set('school', params.school);
  if (params.neighborhood) qs.set('neighborhood', params.neighborhood);
  if (params.sort) qs.set('sort', params.sort);
  if (params.dir) qs.set('dir', params.dir);
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
  body: { cnh: string | null; plate: string | null },
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

/** Zona de preço enviada ao salvar (id ausente = nova; ids que somem são removidos). */
export interface PriceZoneInput {
  id?: number;
  name: string;
  school: string | null;
  neighborhoods: string[];
  monthlyFee: number;
  annualFee: number | null;
  installmentMonthlyFee: number | null;
}

export function updatePricing(
  token: string,
  body: {
    monthlyFee: number;
    annualFee: number | null;
    installmentMonthlyFee: number | null;
    acceptsProposals: boolean;
    zones: PriceZoneInput[];
  },
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

/** Define/limpa o modelo de contrato (texto) exibido ao responsável na assinatura. */
export function updateContractTemplate(
  token: string,
  template: string | null,
): Promise<TransporterProfileDto> {
  return apiFetch<TransporterProfileDto>('/api/transporters/me/contract-template', {
    method: 'PUT',
    body: { template },
    token,
  });
}

/** [Transportador] Atualiza a descrição/biografia. */
export function updateTransporterBio(token: string, bio: string): Promise<TransporterProfileDto> {
  return apiFetch<TransporterProfileDto>('/api/transporters/me/bio', {
    method: 'PUT',
    body: { bio },
    token,
  });
}
