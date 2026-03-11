'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AuthApi } from '@scaffold/api/client';
import type { LoginResultDto } from '@scaffold/api/client';
import { AUTH_STORAGE_KEY } from '@scaffold/shared';

/** 登录接口可能返回的 token 字段（JWT / OAuth2 常见形态），与 LoginResultDto 兼容 */
export type AuthLoginResult = LoginResultDto & {
  accessToken?: string;
  refreshToken?: string;
  /** 有效时长（秒），前端可据此算 expiresAt */
  expiresIn?: number;
};

/** 持久化结构：user 必选，token 相关可选；无 token 时与仅存 user 的旧格式兼容 */
export interface StoredAuth {
  user: LoginResultDto;
  accessToken?: string;
  refreshToken?: string;
  /** 毫秒时间戳，accessToken 过期时间 */
  expiresAt?: number;
}

export interface AuthState {
  user: LoginResultDto | null;
  /** 当前 accessToken（有则可用于 getAuthHeaders，兼容 JWT/OAuth2） */
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  /** 供请求封装注入鉴权头：有 accessToken 时返回 { Authorization: 'Bearer <token>' }，否则 {} */
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredAuth>;
    if (!data?.user) return null;
    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    };
  } catch {
    return null;
  }
}

function writeStoredAuth(stored: StoredAuth | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (stored?.user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[AuthContext] Failed to write auth to storage', error);
    }
  }
}

export interface AuthProviderProps {
  apiBaseUrl: string;
  children: ReactNode;
}

export function AuthProvider({ apiBaseUrl, children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResultDto | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const authApi = useMemo(() => new AuthApi(apiBaseUrl), [apiBaseUrl]);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored.user);
      setAccessToken(stored.accessToken ?? null);
    }
    setHydrated(true);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const data = (await authApi.login({ username, password })) as AuthLoginResult;
        const userInfo: LoginResultDto = {
          id: data.id,
          username: data.username,
          email: data.email,
        };
        const expiresAt = data.expiresIn
          ? Date.now() + data.expiresIn * 1000
          : undefined;
        const stored: StoredAuth = {
          user: userInfo,
          ...(data.accessToken && { accessToken: data.accessToken }),
          ...(data.refreshToken && { refreshToken: data.refreshToken }),
          ...(expiresAt !== undefined && { expiresAt }),
        };
        setUser(userInfo);
        setAccessToken(data.accessToken ?? null);
        writeStoredAuth(stored);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '登录失败';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authApi]
  );

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setError(null);
    writeStoredAuth(null);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = hydrated ? accessToken : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [accessToken, hydrated]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: hydrated ? user : null,
      accessToken: hydrated ? accessToken : null,
      isLoading,
      error,
      login,
      logout,
      setError,
      getAuthHeaders,
    }),
    [user, accessToken, hydrated, isLoading, error, login, logout, getAuthHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
