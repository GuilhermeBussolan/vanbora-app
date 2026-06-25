/**
 * Passagem da seleção de público entre a tela de criação/edição de aviso e a
 * tela de seleção (notice-audience). Estado em memória, de vida curta.
 *
 * Convenção: `null` = todos os responsáveis; array = ids de GuardianProfile.
 */

let seed: number[] | null = null;
let result: { ids: number[] | null } | null = null;

/** Chamado antes de abrir a tela de seleção, com a seleção atual. */
export function openAudience(currentIds: number[] | null): void {
  seed = currentIds;
  result = null;
}

/** A tela de seleção lê a seleção inicial. */
export function getAudienceSeed(): number[] | null {
  return seed;
}

/** A tela de seleção confirma o resultado. */
export function commitAudience(ids: number[] | null): void {
  result = { ids };
}

/** A tela de criação/edição lê o resultado (uma vez). `undefined` = sem mudança. */
export function consumeAudienceResult(): number[] | null | undefined {
  if (!result) return undefined;
  const ids = result.ids;
  result = null;
  return ids;
}
