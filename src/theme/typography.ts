import { TextStyle } from 'react-native';
import { lightColors, ThemeColors } from './colors';

/**
 * Estilos tipográficos reutilizáveis. A cor depende da paleta ativa, então a
 * tipografia é construída a partir das cores do tema (via `useTheme()`).
 */
export function createTypography(colors: ThemeColors) {
  return {
    screenTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    body: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textPrimary,
    },
    label: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    button: {
      fontSize: 16,
      fontWeight: '700',
    },
  } satisfies Record<string, TextStyle>;
}

export type Typography = ReturnType<typeof createTypography>;

/** Tipografia estática padrão (clara), rede de segurança para usos fora de componentes. */
export const typography = createTypography(lightColors);
