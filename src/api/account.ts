import { apiFetch } from './client';

/** Troca a senha do usuário autenticado. */
export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return apiFetch<void>('/api/account/password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    token,
  });
}
