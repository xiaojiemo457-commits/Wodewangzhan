import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileText,
  Home,
  BookOpen,
  Camera,
  Music,
  User,
  Wrench,
  CornerDownLeft,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

type ResultType = '文章' | '页面' | '工具';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: ResultType;
  url: string;
  icon: typeof FileText;
}

const pageLinks: SearchResult[] = [
  { id: 'page-home', title: '首页', subtitle: '/', type: '页面', url: '/', icon: Home },
  { id: 'page-thoughts', title: '日记', subtitle: '/thoughts', type: '页面', url: '/thoughts', icon: BookOpen },
  { id: 'page-treasure', title: '宝典', subtitle: '/treasure', type: '页面', url: '/treasure', icon: BookOpen },
  { id: 'page-moments', title: '瞬间', subtitle: '/moments', type: '页面', url: '/moments', icon: Camera },
  { id: 'page-music', title: '音乐', subtitle: '/music', type: '页面', url: '/music', icon: Music },
  { id: 'page-about', title: '关于', subtitle: '/about', type: '页面', url: '/about', icon: User },
];

const typeBadgeClass: Record<ResultType, string> = {
  文章: 'bg-indigo-500/20 text-indigo-300',
  页面: 'bg-emerald-500/20 text-emerald-300',
  工具: 'bg-amber-500/20 text-amber-300',
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const { isDark, commandPaletteOpen, setCommandPaletteOpen, articles, tools } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen]);

  // Auto-focus input on open & reset query
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [commandPaletteOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    const list: SearchResult[] = [];

    // Pages: always show when no query, else match
    const matchedPages = q
      ? pageLinks.filter((p) => p.title.toLowerCase().includes(q))
      : pageLinks;
    list.push(...matchedPages);

    // Articles: match by title (substring, case insensitive)
    const matchedArticles = articles.filter((a) =>
      q ? a.title.toLowerCase().includes(q) : true,
    );
    list.push(
      ...matchedArticles.map((a) => ({
        id: `article-${a.id}`,
        title: a.title,
        subtitle: a.summary || a.category?.name || '文章',
        type: '文章' as ResultType,
        url: `/thoughts/${a.id}`,
        icon: FileText,
      })),
    );

    // Tools: match by name
    const matchedTools = tools.filter((t) =>
      q ? t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) : true,
    );
    list.push(
      ...matchedTools.map((t) => ({
        id: `tool-${t.id}`,
        title: t.name,
        subtitle: t.description || t.url,
        type: '工具' as ResultType,
        url: '/treasure',
        icon: Wrench,
      })),
    );

    return list.slice(0, 8);
  }, [query, articles, tools]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const go = (url: string) => {
    setCommandPaletteOpen(false);
    navigate(url);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) go(results[selectedIndex].url);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className={cn(
          'w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl',
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className={cn(
            'flex items-center gap-3 border-b px-4 py-3',
            isDark ? 'border-gray-800' : 'border-gray-200',
          )}
        >
          <Search
            size={18}
            className={isDark ? 'text-gray-500' : 'text-gray-400'}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章、页面、工具..."
            className={cn(
              'flex-1 bg-transparent text-sm outline-none',
              isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400',
            )}
          />
          <kbd
            className={cn(
              'rounded border px-1.5 py-0.5 text-xs',
              isDark ? 'border-gray-700 text-gray-500' : 'border-gray-300 text-gray-400',
            )}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div
              className={cn(
                'py-10 text-center text-sm',
                isDark ? 'text-gray-500' : 'text-gray-400',
              )}
            >
              未找到匹配结果
            </div>
          ) : (
            results.map((result, index) => {
              const Icon = result.icon;
              const active = index === selectedIndex;
              return (
                <button
                  key={result.id}
                  onClick={() => go(result.url)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition',
                    active
                      ? isDark
                        ? 'bg-gray-800'
                        : 'bg-gray-100'
                      : '',
                  )}
                >
                  <Icon
                    size={18}
                    className={isDark ? 'text-gray-400' : 'text-gray-500'}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'truncate text-sm font-medium',
                        isDark ? 'text-gray-200' : 'text-gray-800',
                      )}
                    >
                      {result.title}
                    </div>
                    <div
                      className={cn(
                        'truncate text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-400',
                      )}
                    >
                      {result.subtitle}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      typeBadgeClass[result.type],
                    )}
                  >
                    {result.type}
                  </span>
                  {active && (
                    <CornerDownLeft
                      size={14}
                      className={isDark ? 'text-gray-600' : 'text-gray-400'}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
