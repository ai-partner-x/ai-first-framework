import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, KeyRound, Search } from 'lucide-react';
import { userApi, roleApi } from '../api';

interface User {
  id: number; username: string; realName?: string;
  email?: string; phone?: string; status: number;
}

interface Role { id: number; roleName: string; }

const INIT_FORM = { username: '', password: '', realName: '', email: '', phone: '', status: 1, roleIds: [] as number[] };

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...INIT_FORM });
  const [resetModal, setResetModal] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const loadUsers = async () => {
    try {
      const res = await userApi.page({ pageNo: page, pageSize, username: keyword });
      setUsers(res.records);
      setTotal(res.total);
    } catch {}
  };

  useEffect(() => { loadUsers(); }, [page, keyword]);
  useEffect(() => { roleApi.list().then(setRoles).catch(() => {}); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...INIT_FORM });
    setShowModal(true);
  };

  const openEdit = async (u: User) => {
    const detail = await userApi.getById(u.id);
    setEditId(u.id);
    setForm({ ...INIT_FORM, ...detail, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        const { password, ...rest } = form;
        await userApi.update(editId, rest);
      } else {
        await userApi.create(form);
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该用户？')) return;
    try { await userApi.delete(id); loadUsers(); } catch (err: any) { alert(err.message); }
  };

  const handleResetPwd = async () => {
    if (!newPwd) return alert('请输入新密码');
    try {
      await userApi.resetPassword(resetModal!, newPwd);
      setResetModal(null); setNewPwd('');
      alert('密码重置成功');
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">用户管理</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
          <Plus size={15} /> 新增用户
        </button>
      </div>

      {/* 搜索 */}
      <div className="flex gap-2 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-2 text-gray-400" />
          <input value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }}
            placeholder="搜索用户名/姓名"
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              {['用户名', '姓名', '邮箱', '手机号', '状态', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                <td className="px-4 py-3 text-gray-600">{u.realName || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{u.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.status === 1 ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                  <button onClick={() => { setResetModal(u.id); setNewPwd(''); }} className="text-orange-500 hover:text-orange-700"><KeyRound size={14} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
        {/* 分页 */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">上一页</button>
            <span className="px-3 py-1">{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
            <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">下一页</button>
          </div>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">{editId ? '编辑用户' : '新增用户'}</h2>
            {(['username', 'realName', 'email', 'phone'] as const).map(field => (
              <div key={field}>
                <label className="block text-sm text-gray-600 mb-1">
                  {{ username: '用户名', realName: '姓名', email: '邮箱', phone: '手机号' }[field]}
                  {field === 'username' && !editId && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input required={field === 'username' && !editId}
                  disabled={field === 'username' && !!editId}
                  value={(form as any)[field] || ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
              </div>
            ))}
            {!editId && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">密码 <span className="text-red-500">*</span></label>
                <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">角色</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.roleIds.includes(r.id)}
                      onChange={e => setForm(f => ({ ...f, roleIds: e.target.checked ? [...f.roleIds, r.id] : f.roleIds.filter(x => x !== r.id) }))} />
                    {r.roleName}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {loading ? '保存中...' : '确定'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {resetModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">重置密码</h2>
            <input type="password" placeholder="请输入新密码" value={newPwd} onChange={e => setNewPwd(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setResetModal(null)} className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={handleResetPwd} className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
