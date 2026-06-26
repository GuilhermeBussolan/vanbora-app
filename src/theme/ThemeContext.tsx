import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { createTypography, Typography } from './typography';
import { defaultThemePref, loadThemePref, saveThemePref, ThemePref } from './themePref';

interface ThemeContextValue {
  /** Paleta de cores ativa (clara ou escura). */
  colors: ThemeColors;
  /** Tipografia construída a partir da paleta ativa. */
  typography: Typography;
  /** Esquema efetivamente aplicado. */
  scheme: 'light' | 'dark';
  /** Preferência escolhida pelo usuário (pode ser 'system'). */
  preference: ThemePref;
  /** Atalho para `scheme === 'dark'`. */
  isDark: boolean;
  /** Altera e persiste a preferência de tema. */
  setPreference: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Provê o tema (claro/escuro) para todo o app. A preferência é persistida
 * localmente (AsyncStorage); 'system' acompanha o tema do sistema operacional.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePref>(defaultThemePref);

  // Restaura a preferência salva ao iniciar.
  useEffect(() => {
    loadThemePref()
      .then(setPreferenceState)
      .catch(() => {
        /* mantém o padrão */
      });
  }, []);

  const setPreference = useCallback((pref: ThemePref) => {
    setPreferenceState(pref);
    saveThemePref(pref);
  }, []);

  const scheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const colors = scheme === 'dark' ? darkColors : lightColors;
  const typography = useMemo(() => createTypography(colors), [colors]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      typography,
      scheme,
      preference,
      isDark: scheme === 'dark',
      setPreference,
    }),
    [colors, typography, scheme, preference, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Acessa o tema ativo. Deve ser usado dentro de `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return ctx;
}

/**
 * Constrói estilos a partir da paleta/tipografia ativas e devolve também
 * `colors`/`typography` para uso inline (ícones, cores soltas em JSX).
 * O `factory` deve ser definido em escopo de módulo (referência estável).
 */
export function useThemedScreen<T>(
  factory: (colors: ThemeColors, typography: Typography) => T,
): { colors: ThemeColors; typography: Typography; styles: T } {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => factory(colors, typography), [colors, typography, factory]);
  return { colors, typography, styles };
}
