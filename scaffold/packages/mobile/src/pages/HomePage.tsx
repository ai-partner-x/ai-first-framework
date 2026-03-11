import { useAuth } from '@scaffold/shared-auth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/routes';

/**
 * 移动端通用主页，展示产品名 AIKO-BOOT
 */
export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 safe-area-top">
        <span className="text-lg font-medium text-gray-800">AIKO-BOOT</span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          退出
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">AIKO-BOOT</h1>
        <p className="text-gray-500 text-sm">欢迎回来，{user?.username ?? ''}</p>
      </main>
    </div>
  );
}
