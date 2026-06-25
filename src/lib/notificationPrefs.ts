import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vanbora.notificationPrefs';

export interface NotificationPrefs {
  tripUpdates: boolean;
  payments: boolean;
  notices: boolean;
}

export const defaultPrefs: NotificationPrefs = {
  tripUpdates: true,
  payments: true,
  notices: true,
};

/** Lê as preferências de notificação (locais ao aparelho). */
export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

/** Persiste as preferências de notificação. */
export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignora falha de persistência */
  }
}
