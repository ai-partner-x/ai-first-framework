import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import {
  Users, ShieldCheck, Menu as MenuIcon, LayoutDashboard,
  LogOut, ChevronDown, ChevronRight, Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { menuApi } from '../api';

const ICON_MAP: Record<string, any> = {
  Users, ShieldCheck, Settings, LayoutDashboard,
};

interface MenuNode {
  id: number;
  menuName: string;
  path?: string;
  icon?: string;
  children?: MenuNode[];
}

function SideMenuItem({ item }: { item: MenuNode }) {
  const [open, setOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = ICON_MAP[item.icon || ''] ?? MenuIcon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors"
        >
          <Icon size={16} className="mr-2 shrink-0" />
          <span className="flex-1 text-left">{item.menuName}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-4 border-l border-gray-700 pl-2">
            {item.children!.map(child => <SideMenuItem key={child.id} item={child} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path || '#'}
      className={({ isActive }) =>
        `flex items-center px-4 py-2.5 text-sm rounded-md transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      <Icon size={16} className="mr-2 shrink-0" />
      {item.menuName}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuNode[]>([]);

  useEffect(() => {
    menuApi.userTree().then(setMenus).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-800 flex flex-col shrink-0">
        <div className="flex items-center h-14 px-4 border-b border-gray-700">
          <span className="text-white font-semibold text-base">管理后台</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm rounded-md transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <LayoutDashboard size={16} className="mr-2 shrink-0" />
            工作台
          </NavLink>
          {menus.map(m => <SideMenuItem key={m.id} item={m} />)}
        </nav>
        {/* User info */}
        <div className="border-t border-gray-700 px-4 py-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(user?.realName || user?.username || '?')[0].toUpperCase()}
          </div>
          <span className="text-gray-300 text-sm flex-1 truncate">{user?.realName || user?.username}</span>
          <button onClick={handleLogout} title="退出登录" className="text-gray-400 hover:text-white">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
