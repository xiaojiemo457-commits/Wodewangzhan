import { useEffect, useMemo, useState } from 'react';
import { Search, LayoutGrid, List, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import ArticleCard from '../components/blog/ArticleCard';
import { cn } from '../lib/utils';

type ViewMode = 'grid' | 'list' | 'timeline';
const PER_PAGE = 24;
const STORAGE_KEY = 'thoughts-view-mode';

const TABS = [
  { id: 'all', name: '全部' },
  { id: '1', name: '技术' },
  { id: '2', name: '生活' },
  { id: '3', name: '阅读' },
  { id: '4', name: '旅行' },
  { id: '5', name: '思考' },
  { id: '6', name: '爱情' },
];

const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: 'grid', icon: LayoutGrid, label: '网格' },
  { mode: 'list', icon: List, label: '列表' },
  { mode: 'timeline', icon: History, label: '时间线' },
];

function getStoredViewMode(): ViewMode {
  const v = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (v === 'grid' || v === 'list' || v === 'timeline') return v;
  return 'grid';
}

export default function Thoughts() {
  const isDark = useStore((s) => s.isDark);
  const articles = useStore((s) => s.articles);
  const loading = useStore((s) => s.loadingArticles);
  const fetchArticles = useStore((s) => s.fetchArticles);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [totalPages, setTotalPages] = useState(0);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchArticles({
      category: category === 'all' ? undefined : category,
      search: search || undefined,
      page,
    }).then((res) => {
      setTotalPages(res.totalPages);
    });
  }, [category, search, page, fetchArticles]);

  const handleCategoryChange = (id: string) => {
    setCategory(id);
    setPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // Defensive client-side category filter (string comparison)
  const visibleArticles = useMemo(() => {
    if (category === 'all') return articles;
    return articles.filter((a) => String(a.category_id) === category);
  }, [articles, category]);

  const groupedTimeline = useMemo(() => {
    const groups: { key: string; items: typeof articles }[] = [];
    const map = new Map<string, typeof articles>();
    visibleArticles.forEach((a) => {
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    map.forEach((items, key) => groups.push({ key, items }));
    return groups;
  }, [visibleArticles]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    const end = Math.min(totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  const showPagination = totalPages > 1;

  return (
    <div className={cn('mx-auto max-w-6xl px-4 py-10 sm:px-6', isDark ? 'text-white' : 'text-gray-900')}>
      {/* ===== Header ===== */}
      <div className="mb-8">
        <h1 className={cn('mb-2 text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>日记</h1>
        <p className={cn('text-sm', isDark ? 'text-white/50' : 'text-gray-500')}>记录生活与思考的每一刻</p>
      </div>

      {/* ===== Search bar ===== */}
      <div className="relative mb-6">
        <Search
          size={18}
          className={cn(
            'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2',
            isDark ? 'text-white/40' : 'text-gray-400'
          )}
        />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="搜索文章标题或内容…"
          className={cn(
            'w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition-colors',
            isDark
              ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/30 focus:border-white/40'
              : 'border-black/10 bg-white text-gray-900 placeholder:text-gray-400 focus:border-black/30'
          )}
        />
      </div>

      {/* ===== Category bar + view switcher ===== */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={cn('-mx-1 flex gap-1 overflow-x-auto px-1 pb-1', isDark ? '' : '')}>
          {TABS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={cn(
                  'flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors',
                  active
                    ? isDark
                      ? 'bg-white text-black'
                      : 'bg-black text-white'
                    : isDark
                      ? 'text-white/60 hover:bg-white/5 hover:text-white'
                      : 'text-gray-500 hover:bg-black/5 hover:text-gray-800'
                )}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className={cn('flex flex-shrink-0 items-center gap-1 rounded-lg border p-1', isDark ? 'border-white/10' : 'border-black/10')}>
          {VIEW_MODES.map(({ mode, icon: Icon, label }) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => handleViewModeChange(mode)}
                className={cn(
                  'rounded-md p-1.5 transition-colors',
                  active
                    ? isDark
                      ? 'bg-white/15 text-white'
                      : 'bg-black/10 text-gray-900'
                    : isDark
                      ? 'text-white/40 hover:text-white/80'
                      : 'text-gray-400 hover:text-gray-700'
                )}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Content ===== */}
      {loading && visibleArticles.length === 0 ? (
        <div className={cn('py-20 text-center text-sm', isDark ? 'text-white/40' : 'text-gray-400')}>加载中…</div>
      ) : visibleArticles.length === 0 ? (
        <div
          className={cn(
            'rounded-2xl border border-dashed py-20 text-center text-sm',
            isDark ? 'border-white/10 text-white/40' : 'border-black/10 text-gray-400'
          )}
        >
          暂无文章
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((a) => (
            <ArticleCard key={a.id} article={a} variant="grid" />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {visibleArticles.map((a) => (
            <ArticleCard key={a.id} article={a} variant="list" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedTimeline.map(({ key, items }) => (
            <div key={key}>
              <div className="mb-5 flex items-center gap-3">
                <span className={cn('h-3 w-3 rounded-full', isDark ? 'bg-white' : 'bg-black')} />
                <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{key}</h3>
                <span className={cn('text-xs', isDark ? 'text-white/40' : 'text-gray-400')}>
                  {items.length} 篇
                </span>
              </div>
              <div
                className={cn(
                  'ml-1.5 space-y-5 border-l pb-2 pl-6',
                  isDark ? 'border-white/10' : 'border-black/10'
                )}
              >
                {items.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="timeline" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Pagination ===== */}
      {showPagination && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
            )}
          >
            <ChevronLeft size={16} />
            上一页
          </button>

          {pageNumbers[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPage(1)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                )}
              >
                1
              </button>
              {pageNumbers[0] > 2 && <span className={cn('px-1', isDark ? 'text-white/40' : 'text-gray-400')}>…</span>}
            </>
          )}

          {pageNumbers.map((p) => {
            const active = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  'min-w-[2.25rem] rounded-lg px-3 py-2 text-sm transition-colors',
                  active
                    ? isDark
                      ? 'bg-white font-medium text-black'
                      : 'bg-black font-medium text-white'
                    : isDark
                      ? 'hover:bg-white/5'
                      : 'hover:bg-black/5'
                )}
              >
                {p}
              </button>
            );
          })}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className={cn('px-1', isDark ? 'text-white/40' : 'text-gray-400')}>…</span>
              )}
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm transition-colors',
                  isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
                )}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'
            )}
          >
            下一页
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
