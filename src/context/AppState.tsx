import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AuthResponse, login as apiLogin } from '@/api/auth';
import { registerPushToken, removePushToken } from '@/api/account';
import { listDependents } from '@/api/dependents';
import { registerForPushNotifications } from '@/lib/push';
import { AuthUser, DependentDto, UserRole } from '@/types';

const STORAGE_KEY = 'vanbora.session';
const DEPENDENT_KEY = 'vanbora.selectedDependent';

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
  /** Dependentes do responsável (vazio para transportador). */
  dependents: DependentDto[];
  /** Dependente atualmente selecionado (visão do app por filho). */
  selectedDependentId: number | null;
  /** Troca o dependente em foco (persistido localmente). */
  selectDependent: (id: number) => void;
  /** Recarrega a lista de dependentes (ex.: após adicionar um). */
  refreshDependents: () => Promise<void>;
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
  const [dependents, setDependents] = useState<DependentDto[]>([]);
  const [selectedDependentId, setSelectedDependentId] = useState<number | null>(null);
  // Token de push (Expo) do aparelho, para removê-lo do backend no logout.
  const pushTokenRef = useRef<string | null>(null);

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

  const selectDependent = useCallback((id: number) => {
    setSelectedDependentId(id);
    AsyncStorage.setItem(DEPENDENT_KEY, String(id)).catch(() => undefined);
  }, []);

  const refreshDependents = useCallback(async () => {
    if (!token) return;
    try {
      const list = await listDependents(token);
      setDependents(list);
      const stored = await AsyncStorage.getItem(DEPENDENT_KEY);
      const storedId = stored ? Number(stored) : null;
      const valid = storedId != null && list.some((d) => d.id === storedId);
      const chosen = valid ? storedId : (list[0]?.id ?? null);
      setSelectedDependentId(chosen);
      if (chosen != null) {
        AsyncStorage.setItem(DEPENDENT_KEY, String(chosen)).catch(() => undefined);
      }
    } catch {
      /* mantém o estado atual em caso de falha */
    }
  }, [token]);

  // Carrega os dependentes do responsável quando há sessão.
  useEffect(() => {
    if (token && role === 'guardian') {
      refreshDependents();
    } else {
      setDependents([]);
      setSelectedDependentId(null);
    }
  }, [token, role, refreshDependents]);

  // Registra o token de push do aparelho no backend quando há sessão.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    registerForPushNotifications()
      .then((expoToken) => {
        if (cancelled || !expoToken) return;
        pushTokenRef.current = expoToken;
        registerPushToken(token, expoToken, Platform.OS).catch(() => undefined);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token]);

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
    // Desregistra o push deste aparelho antes de limpar a sessão (best-effort).
    if (token && pushTokenRef.current) {
      removePushToken(token, pushTokenRef.current).catch(() => undefined);
    }
    pushTokenRef.current = null;
    setToken(null);
    setUser(null);
    setRole(null);
    setHasTransporter(false);
    setDependents([]);
    setSelectedDependentId(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  }, [token]);

  const value = useMemo(
    () => ({
      role,
      hasTransporter,
      token,
      user,
      dependents,
      selectedDependentId,
      selectDependent,
      refreshDependents,
      setRole,
      setHasTransporter: handleSetHasTransporter,
      login,
      applySession,
      logout,
    }),
    [
      role,
      hasTransporter,
      token,
      user,
      dependents,
      selectedDependentId,
      selectDependent,
      refreshDependents,
      handleSetHasTransporter,
      login,
      applySession,
      logout,
    ],
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
