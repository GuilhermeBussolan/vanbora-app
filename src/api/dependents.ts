import { DependentDto } from '@/types';
import { apiFetch } from './client';

/** [Responsável] Lista os dependentes. */
export function listDependents(token: string): Promise<DependentDto[]> {
  return apiFetch<DependentDto[]>('/api/guardians/me/dependents', { token });
}

/** [Responsável] Cadastra um dependente. */
export function addDependent(
  token: string,
  body: { name: string; school: string },
): Promise<DependentDto> {
  return apiFetch<DependentDto>('/api/guardians/me/dependents', {
    method: 'POST',
    body,
    token,
  });
}
