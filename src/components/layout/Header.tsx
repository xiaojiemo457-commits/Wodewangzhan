import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, X, LogIn, LayoutDashboard, Feather } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/', label: '首页' },
  { to: '/thoughts', label: '日记' },
  { to: '/quotes', label: '语录' },
  { to: '/treasure', label: '宝典' },
  { to: '/timeline', label: '时间轴' },
  { to: '/music', label: '音乐' },
  { to: '/about', label: '关于' },
];

export default function Header() {
  const { isDark, toggleTheme, isAdmin } = useStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        scrolled ? (isDark ? 'bg-black/60' : 'bg-white/70') : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="首页">
          <span
            className={cn(
              'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
              isDark
                ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/40'
                : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-purple-500/25'
            )}
          >
            <Feather size={18} className="text-white" strokeWidth={2} />
          </span>
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
                  ? isDark
                    ? 'text-white bg-white/10'
                    : 'text-black bg-black/5'
                  : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/5'
                    : 'text-black/70 hover:text-black hover:bg-black/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="切换主题"
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'
            )}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAdmin ? (
            <Link
              to="/admin"
              className={cn(
                'hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isDark
                  ? 'text-white bg-white/10 hover:bg-white/20'
                  : 'text-black bg-black/5 hover:bg-black/10'
              )}
            >
              <LayoutDashboard size={16} />
              控制台
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className={cn(
                'hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isDark
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-black/80 hover:text-black hover:bg-black/5'
              )}
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
            className={cn(
              'md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'
            )}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          className={cn(
            'md:hidden glass-nav border-t transition-colors animate-fade-in',
            isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'
          )}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? isDark
                      ? 'text-white bg-white/10'
                      : 'text-black bg-black/5'
                    : isDark
                      ? 'text-white/70 hover:text-white hover:bg-white/5'
                      : 'text-black/70 hover:text-black hover:bg-black/5'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors',
                  isDark ? 'text-white bg-white/10' : 'text-black bg-black/5'
                )}
              >
                <LayoutDashboard size={16} /> 控制台
              </Link>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors',
                  isDark ? 'text-white/70 hover:bg-white/5' : 'text-black/70 hover:bg-black/5'
                )}
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
