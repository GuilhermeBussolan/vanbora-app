/**
 * Paleta de cores da marca VanBora.
 * Amarelo (#F5C518) + preto sobre fundo branco, conforme protótipo.
 *
 * Há duas paletas com as MESMAS chaves (claro/escuro). O app troca entre elas
 * em tempo de execução via ThemeProvider — por isso as cores são consumidas
 * pelo hook `useTheme()`/`useThemedScreen()`, nunca importando `colors` direto.
 */
export const lightColors = {
  brand: '#F5C518',
  brandDark: '#E0B200',
  brandSoft: '#FFF9E6',

  black: '#111111',
  white: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#FFFFFF',

  textPrimary: '#1A1A1A',
  textSecondary: '#8A8A8E',
  textMuted: '#AAAAAF',
  textOnBrand: '#1A1A1A',

  border: '#ECECEC',
  borderStrong: '#DEDEE2',
  inputBorder: '#E4E4E7',

  success: '#1E9E54',
  successBg: '#E7F7EC',
  warning: '#C8860D',
  warningBg: '#FFF6E0',
  danger: '#D64545',
  dangerBg: '#FBE9E9',

  star: '#F5B301',
  mapBg: '#EFEFF2',

  shadow: '#000000',
} as const;

/** Tipo estrutural da paleta: mesmas chaves, valores string (claro ou escuro). */
export type ThemeColors = { [K in keyof typeof lightColors]: string };

/**
 * Paleta do Modo Noturno. Chaves semânticas mantidas — ex.: `white` vira a cor
 * de superfície escura, então telas/cartões/abas que usavam `colors.white`
 * invertem automaticamente sem precisar alterar cada referência.
 */
export const darkColors: ThemeColors = {
  brand: '#F5C518',
  brandDark: '#E0B200',
  brandSoft: '#2A2613',

  black: '#2C2C2E',
  white: '#1C1C1E',

  background: '#0E0E0F',
  surface: '#1C1C1E',

  textPrimary: '#F5F5F7',
  textSecondary: '#A1A1A6',
  textMuted: '#6E6E73',
  textOnBrand: '#1A1A1A',

  border: '#2C2C2E',
  borderStrong: '#3A3A3C',
  inputBorder: '#3A3A3C',

  success: '#30D158',
  successBg: '#10361F',
  warning: '#FFD60A',
  warningBg: '#3A2F0B',
  danger: '#FF453A',
  dangerBg: '#3A1A1A',

  star: '#F5B301',
  mapBg: '#2C2C2E',

  shadow: '#000000',
};

/**
 * Paleta estática padrão (clara). Mantida para usos fora de componentes e como
 * rede de segurança; dentro de componentes prefira `useTheme().colors`.
 */
export const colors: ThemeColors = lightColors;

export type ColorName = keyof typeof lightColors;
