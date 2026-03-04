import { UserApi } from '@user-crud/api/client';
import type { User } from '@user-crud/api/client';

// API 客户端
const userApi = new UserApi(process.env.API_URL || 'http://localhost:3001');

async function fetchUsers(): Promise<User[]> {
  return (await userApi.list()) ?? [];
}

export default async function HomePage() {
  const users = await fetchUsers();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">用户列表</h1>
          <span className="text-xs text-gray-500">共 {users.length} 人</span>
        </header>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg bg-white px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
              </div>
              <div className="text-xs text-gray-400">
                {user.age ? `${user.age} 岁` : '年龄未知'}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">暂无用户数据</p>
          )}
        </div>
      </div>
    </main>
  );
}
