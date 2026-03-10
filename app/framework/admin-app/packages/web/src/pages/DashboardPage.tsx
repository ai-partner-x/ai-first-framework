import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-2">工作台</h1>
      <p className="text-gray-500 text-sm">
        欢迎回来，<span className="font-medium text-gray-700">{user?.realName || user?.username}</span>！
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: '用户管理', path: '/sys/user', color: 'bg-blue-50 text-blue-700' },
          { label: '角色管理', path: '/sys/role', color: 'bg-green-50 text-green-700' },
          { label: '菜单管理', path: '/sys/menu', color: 'bg-purple-50 text-purple-700' },
        ].map(card => (
          <a
            key={card.label}
            href={card.path}
            className={`${card.color} rounded-xl p-5 font-medium text-sm hover:opacity-80 transition-opacity`}
          >
            {card.label} →
          </a>
        ))}
      </div>
    </div>
  );
}
