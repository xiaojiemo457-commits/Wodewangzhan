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
  History,
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
  { id: 'page-treasure', title: '宝典', subtitle: '/treasure', type: '页面', url: '/treasure', icon: Wrench },
  { id: 'page-moments', title: '瞬间', subtitle: '/moments', type: '页面', url: '/moments', icon: Camera },
  { id: 'page-timeline', title: '时间轴', subtitle: '/timeline', type: '页面', url: '/timeline', icon: History },
  { id: 'page-music', title: '音乐', subtitle: '/music', type: '页面', url: '/music', icon: Music },
  { id: 'page-about', title: '关于', subtitle: '/about', type: '页面', url: '/about', icon: User },
];

const typeBadgeClass: Record<ResultType, string> = {
  文章: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
  页面: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  工具: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
};

export default function CommandPalette() {
  const navigate = useNavigate();
  const commandPaletteOpen = useStore((s) => s.commandPaletteOpen);
  const articles = useStore((s) => s.articles);
  const tools = useStore((s) => s.tools);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useStore.getState().setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    useStore.getState().setCommandPaletteOpen(false);
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
      useStore.getState().setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => useStore.getState().setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border shadow-2xl border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3 border-gray-200 dark:border-gray-800">
          <Search size={18} className="text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章、页面、工具..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          />
          <kbd className="rounded border px-1.5 py-0.5 text-xs border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
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
                    active && 'bg-gray-100 dark:bg-gray-800',
                  )}
                >
                  <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {result.title}
                    </div>
                    <div className="truncate text-xs text-gray-400 dark:text-gray-500">
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
                    <CornerDownLeft size={14} className="text-gray-400 dark:text-gray-600" />
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
