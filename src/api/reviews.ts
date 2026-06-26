/** Avaliações do responsável sobre o transportador. */
import { apiFetch } from './client';

/** Cria uma avaliação (1 a 5 estrelas + comentário opcional). */
export function createReview(
  token: string,
  transporterId: number,
  rating: number,
  comment?: string,
): Promise<void> {
  return apiFetch<void>(`/api/guardians/me/transporters/${transporterId}/reviews`, {
    method: 'POST',
    body: { rating, comment: comment?.trim() || null },
    token,
  });
}
