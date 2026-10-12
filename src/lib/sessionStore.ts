import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { DEMO, demoRole } from '@/demo/demoMode';
import { demoSession } from '@/demo/demoApi';

/**
 * Onde a sessão (JWT + usuário) é guardada, por plataforma.
 *
 * - **Android/iOS**: `expo-secure-store` — Keystore/Keychain do sistema.
 * - **Web**: `sessionStorage`. O `expo-secure-store` não tem implementação web
 *   (o módulo nativo vem vazio), então chamá-lo no navegador lançava
 *   `TypeError` e derrubava o login. Aqui a web tem um caminho próprio.
 *
 * Na web usamos `sessionStorage` e não `localStorage` de propósito: a sessão
 * morre ao fechar a aba e é apagada junto com "limpar cookies e dados do site".
 * `localStorage` sobreviveria a isso e deixaria alguém logado depois de limpar
 * os dados do navegador — exatamente o comportamento que não queremos.
 *
 * Nenhuma função lança: navegador em modo privativo, armazenamento bloqueado ou
 * Keychain indisponível devem, no pior caso, custar a persistência da sessão —
 * nunca impedir o usuário de entrar.
 */

const isWeb = Platform.OS === 'web';

// Na demonstração, cada perfil (um iframe cada) tem a própria chave de sessão.
const demoKey = (key: string) => (DEMO ? `${key}:${demoRole}` : key);
// Só na primeira abertura a demo entra logada; depois de "Sair", respeita o logout.
const DEMO_STARTED = 'vanbora.demo-started';

function webStorage(): Storage | null {
  try {
    // `window` não existe durante o render estático da web (expo export).
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    // Alguns navegadores lançam ao só tocar em sessionStorage com dados bloqueados.
    return null;
  }
}

export async function getSessionItem(key: string): Promise<string | null> {
  try {
    if (DEMO && isWeb) {
      const storage = webStorage();
      const started = demoKey(DEMO_STARTED);
      if (!storage?.getItem(started)) {
        storage?.setItem(started, '1');
        const session = await demoSession();
        storage?.setItem(demoKey(key), session);
        return session;
      }
      return storage?.getItem(demoKey(key)) ?? null;
    }
    if (isWeb) return webStorage()?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSessionItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      webStorage()?.setItem(demoKey(key), value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* sem persistência: a sessão vale só enquanto o app estiver aberto */
  }
}

export async function deleteSessionItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      webStorage()?.removeItem(demoKey(key));
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* nada a apagar */
  }
}
