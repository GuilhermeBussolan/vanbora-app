import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vanbora.financePrefs';

export interface FinancePrefs {
  showSuggestions: boolean;
}

export const defaultFinancePrefs: FinancePrefs = {
  showSuggestions: true,
};

/** Lê as preferências do painel financeiro (locais ao aparelho). */
export async function loadFinancePrefs(): Promise<FinancePrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultFinancePrefs, ...JSON.parse(raw) } : defaultFinancePrefs;
  } catch {
    return defaultFinancePrefs;
  }
}

/** Persiste as preferências do painel financeiro. */
export async function saveFinancePrefs(prefs: FinancePrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignora falha de persistência */
  }
}
