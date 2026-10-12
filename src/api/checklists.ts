import { ChecklistStatus, GuardianSafetyCheckDto, SafetyChecklistDto } from '@/types';
import { apiFetch, apiMultipart, UploadFile } from './client';

/** Checklists de segurança visíveis ao profissional (motorista ou monitor). */
export function listChecklists(token: string, status?: ChecklistStatus): Promise<SafetyChecklistDto[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<SafetyChecklistDto[]>(`/api/safety-checklists${query}`, { token });
}

export function getChecklist(token: string, id: number): Promise<SafetyChecklistDto> {
  return apiFetch<SafetyChecklistDto>(`/api/safety-checklists/${id}`, { token });
}

/**
 * Conclui o checklist num único envio: itens confirmados + fotos do interior da van.
 * 409 = outro profissional concluiu antes (recarregue para ver quem e quando).
 */
export function completeChecklist(
  token: string,
  id: number,
  items: string[],
  photos: UploadFile[],
): Promise<SafetyChecklistDto> {
  const form = new FormData();
  items.forEach((code) => form.append('items', code));
  // O cast é necessário: o FormData do React Native aceita { uri, name, type }.
  photos.forEach((photo) => form.append('photos', photo as unknown as Blob));
  return apiMultipart<SafetyChecklistDto>(`/api/safety-checklists/${id}/complete`, form, token);
}

/** [Responsável] Conferências de segurança recentes nos percursos do filho. */
export function listGuardianSafetyChecks(
  token: string,
  dependentId?: number | null,
): Promise<GuardianSafetyCheckDto[]> {
  const query = dependentId != null ? `?dependentId=${dependentId}` : '';
  return apiFetch<GuardianSafetyCheckDto[]>(`/api/guardians/me/safety-checks${query}`, { token });
}
