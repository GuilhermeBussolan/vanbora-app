/**
 * Modo demonstração (build `npm run build:demo`, EXPO_PUBLIC_DEMO=1) para o portfólio web:
 * o app roda sem backend, com respostas gravadas e anonimizadas (src/demo/fixtures.json).
 *
 * O perfil vem da URL (`?perfil=responsavel` ou `?perfil=transportador`) e fica guardado em
 * `window.name`, que é próprio de cada iframe e sobrevive a recarregar a página — assim dois
 * celulares na mesma página (um por perfil) não dividem a sessão.
 */
import { Platform } from 'react-native';

export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

export type DemoRole = 'guardian' | 'transporter';

function resolveDemoRole(): DemoRole {
  if (!DEMO || Platform.OS !== 'web' || typeof window === 'undefined') return 'guardian';
  const param = new URLSearchParams(window.location.search).get('perfil');
  if (param === 'transportador' || param === 'responsavel') {
    window.name = `vanbora-demo:${param}`;
  }
  return window.name === 'vanbora-demo:transportador' ? 'transporter' : 'guardian';
}

export const demoRole: DemoRole = resolveDemoRole();
