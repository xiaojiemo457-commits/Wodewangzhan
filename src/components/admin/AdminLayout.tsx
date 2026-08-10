import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Wrench,
  Image,
  Link as LinkIcon,
  Settings as SettingsIcon,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, title: '控制台' },
  { to: '/admin/articles', label: '文章', icon: FileText, title: '文章管理' },
  { to: '/admin/tools', label: '工具', icon: Wrench, title: '工具管理' },
  { to: '/admin/photos', label: '照片', icon: Image, title: '照片管理' },
  { to: '/admin/friend-links', label: '友链', icon: LinkIcon, title: '友链管理' },
  { to: '/admin/settings', label: '设置', icon: SettingsIcon, title: '站点设置' },
];

function getPageTitle(pathname: string): string {
  const item = navItems.find((n) =>
    n.to === '/admin' ? pathname === '/admin' : pathname.startsWith(n.to),
  );
  return item?.title ?? '管理后台';
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsAdmin } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (to: string) =>
    to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(to);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    setIsAdmin(false);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 transform bg-gray-900 border-r border-gray-800 transition-transform duration-200 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <Link to="/admin" className="text-lg font-bold text-white">
            莫的管理后台
          </Link>
          <button
            className="text-gray-400 hover:text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive(item.to)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="md:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900/95 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              className="text-gray-400 hover:text-white md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-white">{getPageTitle(location.pathname)}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">返回前台</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600 hover:text-white"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">退出</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
