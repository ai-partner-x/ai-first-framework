import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { menuApi } from '../api';

interface MenuNode {
  id: number; menuName: string; menuType: number;
  path?: string; permission?: string; icon?: string;
  sortOrder: number; status: number; children?: MenuNode[];
}

const MENU_TYPE = { 1: '目录', 2: '菜单', 3: '按钮' };
const INIT_FORM = { parentId: 0, menuName: '', menuType: 2, path: '', component: '', permission: '', icon: '', sortOrder: 0, status: 1 };

export default function MenuPage() {
  const [tree, setTree] = useState<MenuNode[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...INIT_FORM });
  const [loading, setLoading] = useState(false);

  const loadTree = () => menuApi.tree().then(setTree).catch(() => {});

  useEffect(() => { loadTree(); }, []);

  const openCreate = (parentId = 0) => {
    setEditId(null);
    setForm({ ...INIT_FORM, parentId });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    const detail = await menuApi.getById(id);
    setEditId(id);
    setForm({ ...INIT_FORM, ...detail });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) await menuApi.update(editId, form);
      else await menuApi.create(form);
      setShowModal(false);
      loadTree();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该菜单？')) return;
    try { await menuApi.delete(id); loadTree(); } catch (err: any) { alert(err.message); }
  };

  function renderRows(nodes: MenuNode[], depth = 0): React.ReactNode[] {
    return nodes.flatMap(node => [
      <tr key={node.id} className="hover:bg-gray-50">
        <td className="px-4 py-3 text-gray-800">
          <span style={{ paddingLeft: depth * 20 }} className="flex items-center gap-1">
            {depth > 0 && <span className="text-gray-300">└</span>}
            {node.menuName}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-500 text-xs">{MENU_TYPE[node.menuType as keyof typeof MENU_TYPE] || '-'}</td>
        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{node.path || '-'}</td>
        <td className="px-4 py-3 text-gray-500 text-xs">{node.permission || '-'}</td>
        <td className="px-4 py-3">{node.sortOrder}</td>
        <td className="px-4 py-3">
          <span className={`px-2 py-0.5 rounded-full text-xs ${node.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {node.status === 1 ? '启用' : '禁用'}
          </span>
        </td>
        <td className="px-4 py-3 flex gap-2">
          {node.menuType !== 3 && (
            <button onClick={() => openCreate(node.id)} title="新增子菜单" className="text-green-600 hover:text-green-800"><Plus size={14} /></button>
          )}
          <button onClick={() => openEdit(node.id)} className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
          <button onClick={() => handleDelete(node.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
        </td>
      </tr>,
      ...renderRows(node.children || [], depth + 1),
    ]);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">菜单管理</h1>
        <button onClick={() => openCreate(0)} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
          <Plus size={15} /> 新增菜单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>{['菜单名称', '类型', '路径', '权限标识', '排序', '状态', '操作'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tree.length ? renderRows(tree) : (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-gray-800">{editId ? '编辑菜单' : '新增菜单'}</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">菜单类型 <span className="text-red-500">*</span></label>
              <select value={form.menuType} onChange={e => setForm(f => ({ ...f, menuType: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value={1}>目录</option>
                <option value={2}>菜单</option>
                <option value={3}>按钮</option>
              </select>
            </div>
            {[
              { field: 'menuName', label: '菜单名称', required: true },
              { field: 'path', label: '路径', show: form.menuType !== 3 },
              { field: 'icon', label: '图标', show: form.menuType !== 3 },
              { field: 'permission', label: '权限标识' },
              { field: 'sortOrder', label: '排序', type: 'number' },
            ].filter(f => f.show !== false).map(({ field, label, required, type }) => (
              <div key={field}>
                <label className="block text-sm text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
                <input required={required} type={type || 'text'} value={(form as any)[field] ?? ''}
                  onChange={e => setForm(f => ({ ...f, [field]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">状态</label>
              <button type="button" onClick={() => setForm(f => ({ ...f, status: f.status === 1 ? 0 : 1 }))}
                className={`w-10 h-5 rounded-full transition-colors ${form.status === 1 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${form.status === 1 ? 'translate-x-5' : ''}`} />
              </button>
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
    </div>
  );
}
