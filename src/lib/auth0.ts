import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

/**
 * Login com Google e Facebook via Auth0.
 *
 * Fluxo: **Authorization Code + PKCE**, o indicado para aplicativos móveis. O app
 * é um "cliente público" — qualquer segredo embutido nele seria extraível do
 * pacote —, então não existe client secret aqui: o PKCE prova, com um verificador
 * gerado na hora, que quem troca o código é quem iniciou o login.
 *
 * O app não decide quem está logado. Ele só repassa o `id_token` para a API, que
 * confere a assinatura com as chaves públicas do Auth0 antes de emitir a sessão
 * do VanBora (ver `Auth0TokenVerifier` no backend).
 *
 * ## Configuração
 *
 * 1. `.env.local` do app:
 *        EXPO_PUBLIC_AUTH0_DOMAIN=seu-tenant.us.auth0.com
 *        EXPO_PUBLIC_AUTH0_CLIENT_ID=<client id da aplicação "Native">
 *    Ambos são públicos — o client id de uma aplicação nativa não é segredo.
 *
 * 2. No painel do Auth0, na aplicação (tipo **Native**), em *Allowed Callback URLs*,
 *    inclua a URL que `redirectUri` produz. Ela muda por ambiente:
 *      - build nativo:  vanbora://auth
 *      - Expo Go:       exp://SEU_IP:8081/--/auth
 *      - web:           http://localhost:8081/auth
 *    Rode `console.log(redirectUri)` uma vez para colar o valor exato.
 *
 * 3. Ative as conexões *google-oauth2* e *facebook* no tenant.
 *
 * 4. Na API, defina `AUTH0_DOMAIN` e `AUTH0_AUDIENCE` (o mesmo client id).
 *
 * Sem as variáveis definidas, `isSocialLoginEnabled` é falso e o app simplesmente
 * não mostra os botões.
 */

// Fecha a janela do navegador e devolve o resultado ao app (necessário na web).
WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'google' | 'facebook';

const DOMAIN = (process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
const CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '';

/** true quando o tenant do Auth0 está configurado neste ambiente. */
export const isSocialLoginEnabled = Boolean(DOMAIN && CLIENT_ID);

/** Nome da conexão no Auth0 correspondente a cada provedor. */
const CONNECTION: Record<SocialProvider, string> = {
  google: 'google-oauth2',
  facebook: 'facebook',
};

export const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
};

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${DOMAIN}/authorize`,
  tokenEndpoint: `https://${DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${DOMAIN}/oauth/revoke`,
};

/** URL de retorno registrada no Auth0 (varia por ambiente — veja o cabeçalho). */
export const redirectUri = AuthSession.makeRedirectUri({ scheme: 'vanbora', path: 'auth' });

/** Usuário fechou a janela do provedor sem concluir — não é erro, não vira alerta. */
export class SocialLoginCancelled extends Error {
  constructor() {
    super('Login social cancelado.');
    this.name = 'SocialLoginCancelled';
  }
}

/**
 * Abre a tela do provedor e devolve o `id_token` do Auth0.
 * Lança {@link SocialLoginCancelled} se o usuário desistir.
 */
export async function signInWithProvider(provider: SocialProvider): Promise<string> {
  if (!isSocialLoginEnabled) {
    throw new Error('Login com Google/Facebook não está configurado neste ambiente.');
  }

  const request = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: ['openid', 'profile', 'email'],
    usePKCE: true,
    // Leva direto para o provedor escolhido, pulando a tela de seleção do Auth0.
    extraParams: { connection: CONNECTION[provider] },
  });

  const result = await request.promptAsync(discovery);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new SocialLoginCancelled();
  }
  if (result.type !== 'success') {
    throw new Error('Não foi possível entrar com ' + PROVIDER_LABEL[provider] + '. Tente novamente.');
  }
  if (result.params.error) {
    throw new Error(result.params.error_description ?? 'Falha na autenticação social.');
  }

  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery,
  );

  if (!tokens.idToken) {
    throw new Error('O provedor não devolveu a identificação da conta. Tente novamente.');
  }
  return tokens.idToken;
}
