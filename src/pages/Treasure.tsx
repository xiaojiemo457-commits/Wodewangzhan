import { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Tool } from '../types';
import { cn } from '../lib/utils';
import ToolDetailModal from '../components/treasure/ToolDetailModal';

type SortKey = 'default' | 'recent' | 'popular';

const ICON_COLORS = [
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
];

const getIconColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
};

const readMap = (key: string): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
};

const getLocalClicks = (id: string): number => readMap('tool_clicks')[id] || 0;
const getLastUsed = (id: string): number => readMap('tool_lastused')[id] || 0;

const incrementClicks = (id: string) => {
  const data = readMap('tool_clicks');
  data[id] = (data[id] || 0) + 1;
  localStorage.setItem('tool_clicks', JSON.stringify(data));
};

const setLastUsed = (id: string) => {
  const data = readMap('tool_lastused');
  data[id] = Date.now();
  localStorage.setItem('tool_lastused', JSON.stringify(data));
};

// 服务端点击数 + 本地点击数
const effectiveClicks = (tool: Tool) => (tool.clicks || 0) + getLocalClicks(tool.id);

export default function Treasure() {
  const tools = useStore((s) => s.tools);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('default');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Tool | null>(null);
  // 触发列表重排序的本地计数版本
  const [, setClickVersion] = useState(0);

  useEffect(() => {
    useStore.getState().fetchTools();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((t) => { if (t.category) set.add(t.category); });
    return ['All', ...Array.from(set)];
  }, [tools]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const list = tools.filter((t) => {
      const matchCat = category === 'All' || t.category === category;
      const matchKw = !kw || t.name.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw);
      return matchCat && matchKw;
    });
    if (sort === 'recent') {
      return [...list].sort((a, b) => getLastUsed(b.id) - getLastUsed(a.id));
    }
    if (sort === 'popular') {
      return [...list].sort((a, b) => effectiveClicks(b) - effectiveClicks(a));
    }
    return list;
  }, [tools, search, category, sort]);

  const handleVisit = (tool: Tool) => {
    incrementClicks(tool.id);
    setLastUsed(tool.id);
    setClickVersion((v) => v + 1);
    window.open(tool.url, '_blank', 'noopener,noreferrer');
  };

  const sortTabs: { key: SortKey; label: string }[] = [
    { key: 'default', label: '默认' },
    { key: 'recent', label: '最近使用' },
    { key: 'popular', label: '最常用' },
  ];

  return (
    <div className="min-h-screen pb-16 transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">宝典</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">收藏实用工具，提升效率</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索工具名称或描述..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-colors bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-2 mb-4">
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                sort === tab.key
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                category === c
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {c === 'All' ? '全部' : c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">暂无工具</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setSelected(tool)}
                className="group cursor-pointer rounded-2xl p-5 border transition-all hover:-translate-y-1 hover:shadow-lg bg-white border-gray-100 hover:border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0', getIconColor(tool.name))}>
                    {tool.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{tool.name}</h3>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {tool.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm line-clamp-2 mb-4 min-h-[2.5rem] text-gray-500 dark:text-gray-400">
                  {tool.description}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleVisit(tool); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> 访问
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ToolDetailModal tool={selected} onClose={() => setSelected(null)} onVisit={handleVisit} />
    </div>
  );
}
