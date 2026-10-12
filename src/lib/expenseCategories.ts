import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vanbora.customExpenseCategories';
const MAX_CUSTOM = 12;

/** Categorias que o transportador já digitou na mão (mais recente primeiro), salvas no aparelho. */
export async function loadCustomCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Lembra uma categoria digitada, sem duplicar (case-insensitive), mais recente primeiro. */
export async function rememberCategory(category: string): Promise<void> {
  const trimmed = category.trim();
  if (!trimmed) return;
  try {
    const existing = await loadCustomCategories();
    const next = [
      trimmed,
      ...existing.filter((c) => c.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, MAX_CUSTOM);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignora falha de persistência */
  }
}
