import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthResponse, login as apiLogin } from '@/api/auth';
import { AuthUser, UserRole } from '@/types';

const STORAGE_KEY = 'vanbora.session';

interface StoredSession {
  token: string;
  user: AuthUser;
}

interface AppState {
  role: UserRole | null;
  /** Indica se o responsável já contratou um transportador. */
  hasTransporter: boolean;
  /** Token JWT da sessão atual (null se deslogado). */
  token: string | null;
  /** Usuário autenticado (null se deslogado). */
  user: AuthUser | null;
  setRole: (role: UserRole | null) => void;
  setHasTransporter: (value: boolean) => void;
  /** Autentica na API; lança em caso de erro. Devolve o papel resolvido. */
  login: (email: string, password: string) => Promise<UserRole>;
  /** Grava a sessão a partir de uma resposta de login/cadastro. Devolve o papel. */
  applySession: (response: AuthResponse) => Promise<UserRole>;
  logout: () => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

/** Converte o papel da API (maiúsculas) para o usado no app. */
function toAppRole(apiRole: AuthUser['role']): UserRole {
  return apiRole === 'TRANSPORTER' ? 'transporter' : 'guardian';
}

/**
 * Estado global do app: perfil ativo, sessão (token JWT + usuário) e se há
 * transportador contratado. A sessão é persistida com AsyncStorage.
 */
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [hasTransporter, setHasTransporter] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restaura sessão persistida ao iniciar.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw) as StoredSession;
        setToken(session.token);
        setUser(session.user);
        setRole(toAppRole(session.user.role));
      })
      .catch(() => {
        /* sessão ausente/corrompida: segue deslogado */
      });
  }, []);

  const handleSetHasTransporter = useCallback((value: boolean) => {
    setHasTransporter(value);
  }, []);

  const applySession = useCallback(async (response: AuthResponse): Promise<UserRole> => {
    const appRole = toAppRole(response.user.role);
    setToken(response.token);
    setUser(response.user);
    setRole(appRole);
    setHasTransporter(false);
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: response.token, user: response.user } satisfies StoredSession),
    );
    return appRole;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<UserRole> => {
      const response = await apiLogin(email, password);
      return applySession(response);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setHasTransporter(false);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      role,
      hasTransporter,
      token,
      user,
      setRole,
      setHasTransporter: handleSetHasTransporter,
      login,
      applySession,
      logout,
    }),
    [role, hasTransporter, token, user, handleSetHasTransporter, login, applySession, logout],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState deve ser usado dentro de AppStateProvider');
  }
  return ctx;
}
