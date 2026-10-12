import { CancellationPreviewDto, ContractDto, ContractStatus, PlanType } from '@/types';
import { apiFetch } from './client';

/** [Responsável] Lista contratos, opcionalmente filtrando por status. */
export function listContracts(token: string, status?: ContractStatus): Promise<ContractDto[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<ContractDto[]>(`/api/guardians/me/contracts${query}`, { token });
}

/** [Transportador] Lista seus contratos, opcionalmente filtrando por status (ex.: cancelados). */
export function listTransporterContracts(token: string, status?: ContractStatus): Promise<ContractDto[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<ContractDto[]>(`/api/transporters/me/contracts${query}`, { token });
}

/** [Responsável] Detalhe de um contrato. */
export function getContract(token: string, id: number): Promise<ContractDto> {
  return apiFetch<ContractDto>(`/api/guardians/me/contracts/${id}`, { token });
}

/** [Responsável] Assina o contrato com o plano e o meio de pagamento escolhidos. */
export function signContract(
  token: string,
  id: number,
  paymentMethodId: number,
  planType: PlanType,
): Promise<ContractDto> {
  return apiFetch<ContractDto>(`/api/guardians/me/contracts/${id}/sign`, {
    method: 'POST',
    body: { paymentMethodId, planType },
    token,
  });
}

/** [Responsável] Prévia da rescisão: multa (fidelidade) ou reembolso (anual). */
export function getCancellationPreview(token: string, id: number): Promise<CancellationPreviewDto> {
  return apiFetch<CancellationPreviewDto>(`/api/guardians/me/contracts/${id}/cancellation-preview`, {
    token,
  });
}

/**
 * [Responsável] Cancela (rescinde) o contrato — exige avaliação obrigatória.
 * {@code paymentMethodId} é necessário quando há multa de fidelidade a pagar.
 */
export function cancelContract(
  token: string,
  id: number,
  rating: number,
  comment?: string,
  paymentMethodId?: number | null,
): Promise<ContractDto> {
  return apiFetch<ContractDto>(`/api/guardians/me/contracts/${id}/cancel`, {
    method: 'POST',
    body: { rating, comment: comment?.trim() || null, paymentMethodId: paymentMethodId ?? null },
    token,
  });
}
