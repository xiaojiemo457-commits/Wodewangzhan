import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, X, LogIn, LayoutDashboard, Feather } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: '首页' },
  { to: '/60s', label: '60s' },
  { to: '/all-hot', label: '全平台热榜' },
  { to: '/thoughts', label: '日记' },
  { to: '/treasure', label: '宝典' },
  { to: '/timeline', label: '时间轴' },
  { to: '/music', label: '音乐' },
  { to: '/about', label: '关于' },
];

export default function Header() {
  const isDark = useStore((s) => s.isDark);
  const isAdmin = useStore((s) => s.isAdmin);
  const siteSettings = useStore((s) => s.siteSettings);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    useStore.getState().fetchSiteSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled && 'glass-nav',
        scrolled ? 'bg-white/70 dark:bg-black/60' : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="首页">
          <span className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 dark:shadow-purple-500/40">
            <Feather size={18} className="text-white" strokeWidth={2} />
          </span>
          {siteSettings?.siteTitle && (
            <span className="hidden sm:block text-sm font-semibold text-black/80 dark:text-white/80">
              {siteSettings.siteTitle}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(link.to)
                  ? 'text-black bg-black/5 dark:text-white dark:bg-white/10'
                  : 'text-black/70 hover:text-black hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => useStore.getState().toggleTheme()}
            aria-label="切换主题"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAdmin ? (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-black bg-black/5 hover:bg-black/10 dark:text-white dark:bg-white/10 dark:hover:bg-white/20"
            >
              <LayoutDashboard size={16} />
              控制台
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-black/80 hover:text-black hover:bg-black/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
            >
              <LogIn size={16} />
              登录
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="菜单"
            aria-expanded={mobileOpen}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="md:hidden glass-nav border-t transition-colors animate-fade-in bg-white/80 border-black/10 dark:bg-black/80 dark:border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-black bg-black/5 dark:text-white dark:bg-white/10'
                    : 'text-black/70 hover:text-black hover:bg-black/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors text-black bg-black/5 dark:text-white dark:bg-white/10"
              >
                <LayoutDashboard size={16} /> 控制台
              </Link>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
              >
                <LogIn size={16} /> 登录
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
