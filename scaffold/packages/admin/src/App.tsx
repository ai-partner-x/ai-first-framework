import { useAuth } from '@scaffold/shared-auth';
import { LoginForm } from './components/LoginForm';

export default function App() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <span className="text-gray-800 font-medium">Scaffold Admin</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.username}</span>
          <button
            type="button"
            onClick={() => logout()}
            className="text-sm text-blue-600 hover:underline"
          >
            退出
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <p className="text-gray-600">已登录，后续管理功能待实现</p>
      </main>
    </div>
  );
}
