import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@scaffold/shared-auth';
import { LoginForm } from '@/components/LoginForm';
import { ROUTES } from '@/routes/routes';

/**
 * 登录页：已登录则重定向到主页；登录成功后跳转到 from 或主页
 */
export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (user) {
      navigate(from ?? ROUTES.HOME, { replace: true });
    }
  }, [user, navigate, from]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-500">正在跳转...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
