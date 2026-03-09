import { AuthProvider } from './AuthContext';
import { DEFAULT_API_BASE_URL } from '@scaffold/shared';

function getApiBaseUrl(): string {
  try {
    if (typeof import.meta === 'undefined') return DEFAULT_API_BASE_URL;
    const meta = import.meta as { env?: { VITE_API_URL?: string } };
    const url = meta.env?.VITE_API_URL;
    if (url) return url;
  } catch {
    // ignore
  }
  return DEFAULT_API_BASE_URL;
}

export interface AuthProviderWrapperProps {
  children: React.ReactNode;
  /** 可选：覆盖从环境变量读取的 API 基础 URL */
  apiBaseUrl?: string;
}

/**
 * 为应用根节点提供鉴权 Context，API 地址从 VITE_API_URL 或 shared 默认值读取。
 * admin / mobile 可直接使用，无需各自维护一份。
 */
export function AuthProviderWrapper({ children, apiBaseUrl }: AuthProviderWrapperProps) {
  const baseUrl = apiBaseUrl ?? getApiBaseUrl();
  return <AuthProvider apiBaseUrl={baseUrl}>{children}</AuthProvider>;
}
