import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@scaffold/shared-auth';
import { ROUTES } from './routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 需登录才能访问的页面包装器，未登录时重定向到登录页并记录来自的路径
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
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
