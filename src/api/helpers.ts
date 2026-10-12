import { HelperDto } from '@/types';
import { apiFetch, apiUpload, UploadFile } from './client';

/** [Transportador] Lista os ajudantes/monitores (ativos e inativos). */
export function listHelpers(token: string): Promise<HelperDto[]> {
  return apiFetch<HelperDto[]>('/api/transporters/me/helpers', { token });
}

/** Acesso ao app de um monitor (senha em branco na edição mantém a atual). */
export interface MonitorAccessInput {
  email: string;
  phone: string;
  password?: string;
}

/** [Transportador] Cadastra um ajudante/monitor (com acesso ao app, se informado). */
export function addHelper(
  token: string,
  body: { name: string; role: string; access?: MonitorAccessInput },
): Promise<HelperDto> {
  return apiFetch<HelperDto>('/api/transporters/me/helpers', {
    method: 'POST',
    body,
    token,
  });
}

/** [Transportador] Edita nome/função e (opcionalmente) ativa/inativa o ajudante. */
export function updateHelper(
  token: string,
  id: number,
  body: { name: string; role: string; active?: boolean },
): Promise<HelperDto> {
  return apiFetch<HelperDto>(`/api/transporters/me/helpers/${id}`, {
    method: 'PUT',
    body,
    token,
  });
}

/** [Transportador] Cria/atualiza o acesso ao app do monitor. */
export function setHelperAccess(token: string, id: number, body: MonitorAccessInput): Promise<HelperDto> {
  return apiFetch<HelperDto>(`/api/transporters/me/helpers/${id}/access`, { method: 'PUT', body, token });
}

/** [Transportador] Retira o acesso ao app do monitor (efeito imediato). */
export function revokeHelperAccess(token: string, id: number): Promise<HelperDto> {
  return apiFetch<HelperDto>(`/api/transporters/me/helpers/${id}/access`, { method: 'DELETE', token });
}

/** [Transportador] Exclui o ajudante (monitor: conta desativada, histórico preservado). */
export function deleteHelper(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/helpers/${id}`, { method: 'DELETE', token });
}

/** [Transportador] Define/atualiza a foto do ajudante. */
export function uploadHelperPhoto(token: string, id: number, file: UploadFile): Promise<HelperDto> {
  return apiUpload<HelperDto>(`/api/transporters/me/helpers/${id}/photo`, file, token);
}
