import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { appAuth } from '@scaffold/core';
import type { AuthUser } from '@scaffold/core';
import { ROUTES } from './routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 需登录才能访问的页面包装器，未登录时重定向到登录页并记录来自的路径（与 admin 的 auth 中间件行为一致）
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    appAuth.getIdentity().then(setUser);
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-500">加载中...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
