import { AuthUser } from '@/types';
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
  password: string;
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
  password: string;
  phone: string;
  document?: string;
  cnh?: string;
  plate?: string;
  schools?: string[];
  neighborhoods?: string[];
  baseMonthlyFee?: number | null;
  /** Aceite da Política de Privacidade + Termos de Uso (LGPD). */
  acceptedTerms: boolean;
}

/** Cadastra um transportador (com área e preço) e já devolve a sessão. */
export async function registerTransporter(body: RegisterTransporterBody): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/auth/register/transporter', { method: 'POST', body });
}
