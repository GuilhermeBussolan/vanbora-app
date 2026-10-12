/** Funções possíveis para um ajudante/monitor (usadas no cadastro e edição). */
export const HELPER_ROLES = ['Monitor', 'Auxiliar', 'Motorista', 'Outros'];

/** Função de monitor ("Monitor"/"Monitora") — só essa pode ter acesso ao app (mesma regra da API). */
export function isMonitorRole(role?: string | null): boolean {
  if (!role) return false;
  return role
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .startsWith('monitor');
}
