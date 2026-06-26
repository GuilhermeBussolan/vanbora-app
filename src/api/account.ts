import { ConsentStatusDto } from '@/types';
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

/** Situação do consentimento (LGPD) do usuário autenticado. */
export function getConsentStatus(token: string): Promise<ConsentStatusDto> {
  return apiFetch<ConsentStatusDto>('/api/account/consents', { token });
}

/** Revoga o consentimento vigente (LGPD). */
export function revokeConsent(token: string): Promise<ConsentStatusDto> {
  return apiFetch<ConsentStatusDto>('/api/account/consents/revoke', { method: 'POST', token });
}

/** Registra o token de push (Expo) do aparelho para o usuário autenticado. */
export function registerPushToken(
  jwt: string,
  expoToken: string,
  platform: string,
): Promise<void> {
  return apiFetch<void>('/api/account/push-token', {
    method: 'POST',
    body: { token: expoToken, platform },
    token: jwt,
  });
}

/** Remove o token de push (ex.: logout). */
export function removePushToken(jwt: string, expoToken: string): Promise<void> {
  return apiFetch<void>('/api/account/push-token', {
    method: 'DELETE',
    body: { token: expoToken },
    token: jwt,
  });
}
