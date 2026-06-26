import { ContractDto, ContractStatus } from '@/types';
import { apiFetch } from './client';

/** [Responsável] Lista contratos, opcionalmente filtrando por status. */
export function listContracts(token: string, status?: ContractStatus): Promise<ContractDto[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<ContractDto[]>(`/api/guardians/me/contracts${query}`, { token });
}

/** [Responsável] Detalhe de um contrato. */
export function getContract(token: string, id: number): Promise<ContractDto> {
  return apiFetch<ContractDto>(`/api/guardians/me/contracts/${id}`, { token });
}

/** [Responsável] Assina o contrato com o meio de pagamento escolhido. */
export function signContract(token: string, id: number, paymentMethodId: number): Promise<ContractDto> {
  return apiFetch<ContractDto>(`/api/guardians/me/contracts/${id}/sign`, {
    method: 'POST',
    body: { paymentMethodId },
    token,
  });
}

/** [Responsável] Cancela o contrato — exige avaliação obrigatória do transportador. */
export function cancelContract(
  token: string,
  id: number,
  rating: number,
  comment?: string,
): Promise<ContractDto> {
  return apiFetch<ContractDto>(`/api/guardians/me/contracts/${id}/cancel`, {
    method: 'POST',
    body: { rating, comment: comment?.trim() || null },
    token,
  });
}
