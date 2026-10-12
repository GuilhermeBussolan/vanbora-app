import { useCallback, useEffect, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import { useAppState } from '@/context/AppState';
import { ONBOARDING_CATALOG, currentOnboardingVersion, OnboardingRole } from './content';

interface OnboardingGate {
  /** 'full' = nunca viu nada, guia completo abre sozinho. 'whats-new' = já viu versões
   * antigas, há novidades pendentes (mostrar um aviso discreto, não abrir sozinho).
   * null = está tudo em dia, nada a mostrar. */
  mode: 'full' | 'whats-new' | null;
  /** Quantidade de steps novos desde a última versão vista (só relevante em 'whats-new'). */
  newStepsCount: number;
  /** Abre o guia (modo completo ou só-novidades, conforme `mode`). */
  viewGuide: () => void;
  /** Dispensa a novidade sem abrir o guia — marca como vista mesmo assim. */
  dismissNew: () => void;
}

/**
 * Decide se o usuário logado deve ver o guia de funcionalidades (onboarding) — e, se sim,
 * dispara sozinho o modo "completo" (primeiro acesso). O modo "novidades" nunca navega
 * sozinho — quem chama (a Home) decide como avisar (ex.: um card dispensável).
 *
 * Único ponto de decisão, reaproveitado pelas Homes de responsável e transportador —
 * evita duplicar a lógica de versão em dois lugares.
 */
export function useOnboardingGate(role: OnboardingRole): OnboardingGate {
  const { user, markOnboardingSeen } = useAppState();
  const lastSeen = user?.onboardingLastSeenVersion ?? 0;
  const current = useMemo(() => currentOnboardingVersion(role), [role]);
  const newStepsCount = useMemo(
    () => ONBOARDING_CATALOG[role].filter((step) => step.sinceVersion > lastSeen).length,
    [role, lastSeen],
  );

  // Sem usuário autenticado (deslogado, ou sessão ainda restaurando no boot) não é
  // "nunca viu nada" — é simplesmente não aplicável. Sem essa guarda, o instante em que
  // `user` fica null durante o logout (antes da navegação pro login trocar de tela)
  // era lido como "versão 0" e reabria o guia sozinho ao sair da conta.
  const mode: OnboardingGate['mode'] = !user
    ? null
    : lastSeen <= 0
      ? 'full'
      : lastSeen < current
        ? 'whats-new'
        : null;

  // Evita abrir o guia mais de uma vez por sessão do MESMO usuário mesmo se o componente
  // re-renderizar antes do estado ser atualizado (a chamada de "marcar visto" é
  // assíncrona) — guardado por id, não por um booleano solto, para não travar o
  // auto-open de um usuário novo que logue depois de outro no mesmo aparelho.
  const autoOpenedForUserId = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'full' && user && autoOpenedForUserId.current !== user.id) {
      autoOpenedForUserId.current = user.id;
      router.push('/onboarding');
    }
  }, [mode, user]);

  const viewGuide = useCallback(() => {
    router.push('/onboarding');
  }, []);

  const dismissNew = useCallback(() => {
    markOnboardingSeen(current).catch(() => undefined);
  }, [markOnboardingSeen, current]);

  return { mode, newStepsCount, viewGuide, dismissNew };
}
