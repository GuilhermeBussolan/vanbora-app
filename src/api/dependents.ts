import { DependentDto } from '@/types';
import { apiFetch } from './client';

/** [Responsável] Lista os dependentes. */
export function listDependents(token: string): Promise<DependentDto[]> {
  return apiFetch<DependentDto[]>('/api/guardians/me/dependents', { token });
}

/** [Responsável] Cadastra um dependente. */
export function addDependent(
  token: string,
  body: { name: string; school: string; schoolId?: number | null },
): Promise<DependentDto> {
  return apiFetch<DependentDto>('/api/guardians/me/dependents', {
    method: 'POST',
    body,
    token,
  });
}

/** [Responsável] Edita nome/escola de um dependente. */
export function updateDependent(
  token: string,
  id: number,
  body: { name: string; school: string; schoolId?: number | null },
): Promise<DependentDto> {
  return apiFetch<DependentDto>(`/api/guardians/me/dependents/${id}`, {
    method: 'PUT',
    body,
    token,
  });
}

/** [Responsável] Exclui (arquiva) um dependente. */
export function deleteDependent(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/guardians/me/dependents/${id}`, {
    method: 'DELETE',
    token,
  });
}
