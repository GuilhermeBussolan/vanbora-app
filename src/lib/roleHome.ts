import { UserRole } from '@/types';

/** Tela inicial (grupo de abas) de cada perfil após o login. */
export function homeRouteFor(role: UserRole): '/(transporter)/home' | '/(monitor)/home' | '/(guardian)/home' {
  if (role === 'transporter') return '/(transporter)/home';
  if (role === 'monitor') return '/(monitor)/home';
  return '/(guardian)/home';
}
