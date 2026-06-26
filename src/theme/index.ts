export { colors, lightColors, darkColors } from './colors';
export type { ColorName, ThemeColors } from './colors';
export { spacing, radius } from './spacing';
export { typography, createTypography } from './typography';
export type { Typography } from './typography';
export { ThemeProvider, useTheme, useThemedScreen } from './ThemeContext';
export { loadThemePref, saveThemePref, defaultThemePref } from './themePref';
export type { ThemePref } from './themePref';

/** Sombra leve padronizada para cards. */
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;
