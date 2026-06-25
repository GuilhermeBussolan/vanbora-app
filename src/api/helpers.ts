import { HelperDto } from '@/types';
import { apiFetch, apiUpload, UploadFile } from './client';

/** [Transportador] Lista os ajudantes/monitores (ativos e inativos). */
export function listHelpers(token: string): Promise<HelperDto[]> {
  return apiFetch<HelperDto[]>('/api/transporters/me/helpers', { token });
}

/** [Transportador] Cadastra um ajudante/monitor. */
export function addHelper(
  token: string,
  body: { name: string; role: string },
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

/** [Transportador] Exclui definitivamente um ajudante. */
export function deleteHelper(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/helpers/${id}`, { method: 'DELETE', token });
}

/** [Transportador] Define/atualiza a foto do ajudante. */
export function uploadHelperPhoto(token: string, id: number, file: UploadFile): Promise<HelperDto> {
  return apiUpload<HelperDto>(`/api/transporters/me/helpers/${id}/photo`, file, token);
}
