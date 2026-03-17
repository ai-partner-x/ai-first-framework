import { useNavigate, useLocation } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { appAuth } from '@scaffold/core';
import { LoginForm } from '@/components/LoginForm';
import { ROUTES } from '@/routes/routes';

/**
 * 登录页：已登录则重定向到主页；否则展示登录表单（与 admin 一致）
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  if (appAuth.check().isAuthenticated) {
    return <Navigate to={from ?? ROUTES.HOME} replace />;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoginForm onSuccessRedirectTo={from ?? ROUTES.HOME} navigate={navigate} />
    </main>
  );
}
