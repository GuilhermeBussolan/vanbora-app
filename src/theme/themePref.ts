import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vanbora.themePref';

/** Preferência de tema escolhida pelo usuário. */
export type ThemePref = 'system' | 'light' | 'dark';

export const defaultThemePref: ThemePref = 'system';

/** Lê a preferência de tema (local ao aparelho). */
export async function loadThemePref(): Promise<ThemePref> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === 'system' || raw === 'light' || raw === 'dark') return raw;
    return defaultThemePref;
  } catch {
    return defaultThemePref;
  }
}

/** Persiste a preferência de tema. */
export async function saveThemePref(pref: ThemePref): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignora falha de persistência */
  }
}
