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

/**
 * Encerra a sessão no servidor, invalidando este token.
 *
 * Apagar o token do aparelho não basta: o JWT é auto-contido e continuaria aceito
 * até expirar. Só as sessões deste aparelho são afetadas.
 */
export function logout(token: string): Promise<void> {
  return apiFetch<void>('/api/account/logout', { method: 'POST', token });
}

/** Registra que o usuário viu (ou dispensou) uma versão do guia de funcionalidades. */
export function updateOnboardingProgress(token: string, seenVersion: number): Promise<void> {
  return apiFetch<void>('/api/account/onboarding', {
    method: 'PUT',
    body: { seenVersion },
    token,
  });
}
