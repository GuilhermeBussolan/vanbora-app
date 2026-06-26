import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Notificações push (Expo). O token do aparelho é registrado no backend após o
 * login; o backend dispara avisos nos eventos de contratação (aceite/recusa/etc).
 *
 * Observação: o envio REAL de push exige um development build (EAS). No Expo Go
 * (SDK 53+) o token não é emitido — aqui degradamos com elegância (retorna null).
 */

// Exibe a notificação mesmo com o app aberto (banner + som).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Pede permissão e devolve o token Expo do aparelho (ou null se indisponível). */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push real só em aparelho físico; web/emulador/Expo Go não emitem token.
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }
  try {
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Padrão',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return result.data;
  } catch {
    // Sem projectId/dev build ou permissão negada: segue sem push (não bloqueia o app).
    return null;
  }
}

/** Tipo do payload `data` que o backend envia junto da notificação. */
export interface PushData {
  type?: string;
  contractId?: number | string;
}
