/**
 * Aviso de sessão expirada, do cliente HTTP para o estado global.
 *
 * Quando o token vence (24h) ou é revogado no logout de outro aparelho, toda
 * chamada autenticada volta 401. Sem este canal, o app continuava "logado" com um
 * token morto: cada tela mostrava o seu próprio erro genérico e o usuário não
 * tinha como sair da situação a não ser fechando o app.
 *
 * Módulo em vez de contexto React porque `apiFetch` é uma função comum, chamada
 * fora da árvore de componentes.
 */

type Handler = () => void;

let handler: Handler | null = null;

/** Registra quem trata a expiração (o `AppStateProvider`). */
export function setSessionExpiredHandler(next: Handler | null): void {
  handler = next;
}

/** Chamado pelo cliente HTTP ao receber 401 numa requisição autenticada. */
export function notifySessionExpired(): void {
  handler?.();
}
