/**
 * Rascunho do cadastro em andamento — o que **não** pode viajar em parâmetro de rota.
 *
 * O cadastro do transportador tem 3 telas e levava a senha digitada de uma para a
 * outra via `router.push({ params })`. Parâmetro de rota do Expo Router vira query
 * string: na web a senha aparecia na barra de endereços e ficava no histórico do
 * navegador, e em qualquer plataforma entra no estado de navegação registrado em
 * log de erro. Aqui essas informações ficam apenas em memória, fora da navegação.
 *
 * Módulo simples em vez de contexto React de propósito: nada aqui precisa
 * re-renderizar tela, e o valor precisa sobreviver à troca de rota.
 *
 * Vive só enquanto o app estiver aberto — nunca é persistido — e é apagado assim
 * que o cadastro termina.
 */

export interface SignupDraft {
  /** Senha escolhida no cadastro comum. */
  password?: string;
  /** Ticket do login social: substitui a senha quando o cadastro veio do Google/Facebook. */
  socialTicket?: string;
  /** Dados vindos da conta social, para preencher o formulário. */
  email?: string;
  name?: string;
  provider?: string;
}

let draft: SignupDraft = {};

/** Substitui o rascunho (início de um novo cadastro). */
export function startSignupDraft(value: SignupDraft): void {
  draft = { ...value };
}

/** Mescla campos no rascunho atual (ex.: a senha, ao avançar de etapa). */
export function updateSignupDraft(value: SignupDraft): void {
  draft = { ...draft, ...value };
}

export function getSignupDraft(): SignupDraft {
  return draft;
}

/** true quando o cadastro atual veio de um login social já verificado. */
export function isSocialSignup(): boolean {
  return Boolean(draft.socialTicket);
}

/** Limpa o rascunho — chame ao concluir ou abandonar o cadastro. */
export function clearSignupDraft(): void {
  draft = {};
}
