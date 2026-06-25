import { PaymentMethodDto, PaymentMethodType } from '@/types';
import { apiFetch } from './client';

/** [Responsável] Lista os meios de pagamento salvos. */
export function listPaymentMethods(token: string): Promise<PaymentMethodDto[]> {
  return apiFetch<PaymentMethodDto[]>('/api/guardians/me/payment-methods', { token });
}

/**
 * [Responsável] Salva um meio de pagamento JÁ TOKENIZADO. Envia só o token opaco
 * + bandeira + últimos 4 dígitos — nunca o número do cartão.
 */
export function savePaymentMethod(
  token: string,
  body: { token: string; brand: string; last4: string; type: PaymentMethodType },
): Promise<PaymentMethodDto> {
  return apiFetch<PaymentMethodDto>('/api/guardians/me/payment-methods', {
    method: 'POST',
    body,
    token,
  });
}

/** [Responsável] Remove um meio de pagamento. */
export function deletePaymentMethod(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/guardians/me/payment-methods/${id}`, { method: 'DELETE', token });
}
