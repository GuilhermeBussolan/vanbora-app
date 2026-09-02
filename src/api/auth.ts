import { AuthUser, VehicleAccessibilityFeature, VehicleCharacteristic } from '@/types';
import { apiFetch } from './client';

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

/** Autentica na API e devolve o token JWT + dados do usuário. */
export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/** Dados públicos trazidos da conta social (Google/Facebook). */
export interface SocialProfile {
  email: string;
  name?: string | null;
  provider: string;
}

/**
 * Resultado do login social. Dois desfechos:
 *  - `registered: true` — já existe conta com esse e-mail; `session` vem pronta.
 *  - `registered: false` — primeiro acesso: o app segue para a escolha de perfil
 *    e o cadastro, com os campos preenchidos por `profile` e enviando
 *    `signupTicket` no lugar da senha.
 */
export interface SocialAuthResponse {
  registered: boolean;
  session: AuthResponse | null;
  profile: SocialProfile;
  signupTicket: string | null;
}

/** Envia o id_token do Auth0 para a API validar e resolver a sessão. */
export async function socialLogin(idToken: string): Promise<SocialAuthResponse> {
  return apiFetch<SocialAuthResponse>('/api/auth/social', {
    method: 'POST',
    body: { idToken },
  });
}

export interface AddressBody {
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
}

export interface RegisterGuardianBody {
  name: string;
  email: string;
  /** Senha do cadastro comum. Omitida quando vem `socialTicket`. */
  password?: string;
  /** Ticket do login social, que dispensa a criação de senha. */
  socialTicket?: string;
  phone: string;
  cpf?: string;
  pickup: AddressBody;
  deliverySameAsPickup: boolean;
  delivery?: AddressBody | null;
  /** Aceite da Política de Privacidade + Termos de Uso (LGPD). */
  acceptedTerms: boolean;
}

/** Cadastra um responsável e já devolve a sessão (token + usuário). */
export async function registerGuardian(body: RegisterGuardianBody): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register/guardian', { method: 'POST', body });
}

export interface RegisterTransporterBody {
  name: string;
  email: string;
  /** Senha do cadastro comum. Omitida quando vem `socialTicket`. */
  password?: string;
  /** Ticket do login social, que dispensa a criação de senha. */
  socialTicket?: string;
  phone: string;
  document?: string;
  cnh?: string;
  plate?: string;
  schools?: string[];
  neighborhoods?: string[];
  baseMonthlyFee?: number | null;
  /** Características já selecionadas na etapa "Seu veículo" do cadastro. */
  vehicleCharacteristics?: VehicleCharacteristic[];
  /** Acessibilidade já selecionada na etapa "Seu veículo" do cadastro. */
  vehicleAccessibilityFeatures?: VehicleAccessibilityFeature[];
  /** Aceite da Política de Privacidade + Termos de Uso (LGPD). */
  acceptedTerms: boolean;
}

/** Cadastra um transportador (com área e preço) e já devolve a sessão. */
export async function registerTransporter(body: RegisterTransporterBody): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register/transporter', { method: 'POST', body });
}
