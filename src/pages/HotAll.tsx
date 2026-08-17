import { useEffect, useState } from 'react';
import { AlertTriangle, Flame, Loader2, RefreshCw } from 'lucide-react';
import { fetchHotBoardsAll } from '../services/api';
import type { HotBoardAll, HotBoardItem } from '../types';

// 平台品牌色（卡片头部渐变 + 序号强调色）
const PLATFORM_COLORS: Record<string, string> = {
  rednote: '#FF2442',
  douyin: '#FE2C55',
  bilibili: '#FB7299',
  kuaishou: '#FF4906',
  baidu: '#2932E1',
  toutiao: '#F0401C',
  'qq-news': '#F7B500',
  history: '#8B7355',
};

// 平台 emoji 图标
const PLATFORM_ICONS: Record<string, string> = {
  rednote: '📕',
  douyin: '🎵',
  bilibili: '📺',
  kuaishou: '🎬',
  baidu: '🔍',
  toutiao: '📰',
  'qq-news': '🐧',
  history: '📜',
};

function formatHot(hot: string | number) {
  if (typeof hot === 'number') return hot.toLocaleString();
  const s = String(hot);
  return s === '' ? '' : s;
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

// 单平台卡片：渐变头部（emoji + 名称）+ 前 10 条列表
function BoardCard({ board, color }: { board: HotBoardAll['boards'][number]; color: string }) {
  const failed = !!board.error || board.items.length === 0;
  const icon = PLATFORM_ICONS[board.platform] || '🔥';
  return (
    <div className="group/card rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] dark:bg-gray-900 dark:border-white/10 dark:hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]">
      {/* 头部：品牌色渐变 + 底部色条 */}
      <div
        className="relative flex items-center gap-2.5 px-4 pt-3.5 pb-3"
        style={{ background: `linear-gradient(135deg, ${color}1f, ${color}0a 55%, transparent)` }}
      >
        <span
          className="flex-none w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-sm"
          style={{ backgroundColor: color, boxShadow: `0 2px 10px ${color}66` }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">{board.name}</div>
          {!failed && (
            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Top {board.items.length} · 更新 {fmtTime(board.updated_at)}
            </div>
          )}
          {failed && (
            <div className="inline-flex items-center gap-1 text-[11px] text-red-500 mt-0.5">
              <AlertTriangle size={11} />
              抓取失败
            </div>
          )}
        </div>
        {/* 底部品牌色条 */}
        <span className="absolute left-0 right-0 bottom-0 h-[2.5px]" style={{ background: `linear-gradient(90deg, ${color}, ${color}33)` }} />
      </div>

      {/* 条目列表 */}
      {failed ? (
        <div className="px-4 py-10 text-center text-xs text-gray-400 dark:text-gray-600">
          数据源暂不可用，稍后再试
        </div>
      ) : (
        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
          {board.items.slice(0, 10).map((item, i) => (
            <BoardRow key={item.title + i} item={item} rank={i + 1} color={color} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardRow({ item, rank, color }: { item: HotBoardItem; rank: number; color: string }) {
  const hot = formatHot(item.hot);
  const isTop = rank <= 3;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/row relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
    >
      {/* 左侧 hover 品牌色竖条 */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[2.5px] opacity-0 group-hover/row:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(180deg, ${color}, transparent)` }}
      />
      {/* 排名徽章 */}
      <span
        className="flex-none w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
        style={
          isTop
            ? {
                background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                color: '#fff',
                boxShadow: `0 2px 8px ${color}55`,
              }
            : { color: 'rgba(130,130,130,0.6)', backgroundColor: 'rgba(130,130,130,0.08)' }
        }
      >
        {rank}
      </span>
      {/* 标题 */}
      <span
        className="flex-1 min-w-0 text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 transition-colors group-hover/row:underline group-hover/row:underline-offset-2"
        style={{ ['--tw-underline-color' as any]: color }}
      >
        {item.title}
      </span>
      {/* 热度：无值时显示「热」标记，避免空白 */}
      {hot ? (
        <span
          className="flex-none flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 shrink-0 px-1.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]"
        >
          <Flame size={11} className="text-red-400/90" />
          {hot}
        </span>
      ) : (
        <span className="flex-none flex items-center gap-1 text-[11px] text-red-400 font-semibold shrink-0 px-1.5 py-0.5 rounded-full bg-red-500/10">
          <span className="w-1 h-1 rounded-full bg-red-400" />
          热
        </span>
      )}
    </a>
  );
}

// 加载骨架（匹配新卡片头部）
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-black/[0.06] shadow-sm overflow-hidden dark:bg-gray-900 dark:border-white/10">
      <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="w-16 h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-24 h-2.5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-5 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            <div className="flex-1 h-3.5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${85 - (i % 3) * 15}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HotAll() {
  const [data, setData] = useState<HotBoardAll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    fetchHotBoardsAll()
      .then(setData)
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 全部平台卡片（不分分组，直接平铺）
  const boards = data?.boards ?? [];

  const okCount = data?.boards.filter((b) => !b.error && b.items.length > 0).length ?? 0;
  const updatedTime = data?.updated_at
    ? new Date(data.updated_at).toLocaleString('zh-CN', { hour12: false })
    : '';

  return (
    <div className="min-h-screen transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12">
        {/* 页头 */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-lg shadow-red-500/25 mb-4">
            <Flame className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            全平台热榜
            <span className="ml-2 text-lg font-normal text-gray-400 dark:text-gray-500">All Platforms</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {Object.values(PLATFORM_ICONS).join(' ')} · {data ? data.boards.length : 8} 个平台一屏看全，每平台精选前 10 条
          </p>
          {data && (
            <div className="mt-4 inline-flex items-center gap-2 flex-wrap justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-black/[0.06] shadow-sm dark:bg-white/[0.06] dark:border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {okCount}/{data.boards.length} 平台正常
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-black/[0.06] shadow-sm dark:bg-white/[0.06] dark:border-white/10">
                <RefreshCw size={11} className="text-gray-400" />
                更新于 {updatedTime}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-black/[0.06] shadow-sm dark:bg-white/[0.06] dark:border-white/10">
                ⏱ 缓存 10 分钟
              </span>
            </div>
          )}
        </header>

        {/* 工具栏 */}
        <div className="flex items-center justify-end mb-5">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all bg-white border border-black/10 shadow-sm hover:shadow-md hover:border-black/20 active:scale-95 disabled:opacity-50 dark:bg-white/10 dark:border-white/10 dark:hover:bg-white/15"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>

        {/* 加载骨架 */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* 错误 */}
        {error && !loading && (
          <div className="text-center py-20 text-red-500">
            <p className="text-sm">{error}</p>
            <button
              onClick={load}
              className="mt-4 text-sm underline underline-offset-2 hover:text-red-600"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 平台卡片瀑布流（不分分组，全部平铺） */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {boards.map((b) => (
              <BoardCard key={b.platform} board={b} color={PLATFORM_COLORS[b.platform] || '#888780'} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          数据来源：小红书 / 抖音（60s API）· B站等平台（DailyHotApi 本地实例）· 点击条目可跳转原文
        </p>
      </div>
    </div>
  );
}
