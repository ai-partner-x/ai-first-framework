import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, List } from 'lucide-react';
import { roleApi, menuApi } from '../api';

interface Role { id: number; roleCode: string; roleName: string; description?: string; status: number; }
interface MenuNode { id: number; menuName: string; children?: MenuNode[]; }

const INIT_FORM = { roleCode: '', roleName: '', description: '', status: 1 };

export default function RolePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...INIT_FORM });
  const [loading, setLoading] = useState(false);
  const [menuModal, setMenuModal] = useState<Role | null>(null);
  const [allMenus, setAllMenus] = useState<MenuNode[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]);

  const loadRoles = () => roleApi.list().then(setRoles).catch(() => {});

  useEffect(() => { loadRoles(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...INIT_FORM });
    setShowModal(true);
  };

  const openEdit = async (r: Role) => {
    setEditId(r.id);
    setForm({ roleCode: r.roleCode, roleName: r.roleName, description: r.description || '', status: r.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) await roleApi.update(editId, form);
      else await roleApi.create(form);
      setShowModal(false);
      loadRoles();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该角色？')) return;
    try { await roleApi.delete(id); loadRoles(); } catch (err: any) { alert(err.message); }
  };

  const openMenuModal = async (role: Role) => {
    const [tree, menuIds] = await Promise.all([menuApi.tree(), roleApi.getMenuIds(role.id)]);
    setAllMenus(tree);
    setCheckedMenuIds(menuIds);
    setMenuModal(role);
  };

  const toggleMenu = (id: number) =>
    setCheckedMenuIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

  const saveMenus = async () => {
    if (!menuModal) return;
    try {
      await roleApi.assignMenus(menuModal.id, checkedMenuIds);
      setMenuModal(null);
      alert('权限保存成功');
    } catch (err: any) { alert(err.message); }
  };

  function renderMenuTree(nodes: MenuNode[]) {
    return nodes.map(node => (
      <div key={node.id} className="ml-2">
        <label className="flex items-center gap-1.5 py-0.5 text-sm cursor-pointer">
          <input type="checkbox" checked={checkedMenuIds.includes(node.id)} onChange={() => toggleMenu(node.id)} />
          {node.menuName}
        </label>
        {node.children?.length ? <div className="ml-4">{renderMenuTree(node.children)}</div> : null}
      </div>
    ));
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">角色管理</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
          <Plus size={15} /> 新增角色
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>{['角色编码', '角色名称', '描述', '状态', '操作'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-700">{r.roleCode}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.roleName}</td>
                <td className="px-4 py-3 text-gray-500">{r.description || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status === 1 ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openMenuModal(r)} title="权限配置" className="text-purple-600 hover:text-purple-800"><List size={14} /></button>
                  <button onClick={() => openEdit(r)} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {!roles.length && <tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">{editId ? '编辑角色' : '新增角色'}</h2>
            {[
              { field: 'roleCode', label: '角色编码', required: true, disabled: !!editId },
              { field: 'roleName', label: '角色名称', required: true },
              { field: 'description', label: '描述' },
            ].map(({ field, label, required, disabled }) => (
              <div key={field}>
                <label className="block text-sm text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
                <input required={required} disabled={disabled} value={(form as any)[field] || ''}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50" />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {loading ? '保存中...' : '确定'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 菜单权限弹窗 */}
      {menuModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">配置菜单权限 - {menuModal.roleName}</h2>
            <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg p-3 mb-4">
              {renderMenuTree(allMenus)}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setMenuModal(null)} className="px-4 py-1.5 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={saveMenus} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
