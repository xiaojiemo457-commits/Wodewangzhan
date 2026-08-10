import { useMemo, useState } from 'react';
import { Quote } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { QUOTES, type QuoteItem } from '../data/quotes';

const CATEGORIES: (QuoteItem['category'] | '全部')[] = ['全部', '日常', '吐槽', '感悟', '江湖', '酒后'];

const CATEGORY_STYLES: Record<QuoteItem['category'], string> = {
  日常: 'from-amber-400 to-orange-400',
  吐槽: 'from-pink-500 to-rose-500',
  感悟: 'from-violet-500 to-purple-500',
  江湖: 'from-sky-500 to-cyan-500',
  酒后: 'from-rose-600 to-red-600',
};

export default function Quotes() {
  const { isDark } = useStore();
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('全部');
  const [randomMode, setRandomMode] = useState(false);

  const filtered = useMemo(() => {
    const list = activeCategory === '全部' ? QUOTES : QUOTES.filter((q) => q.category === activeCategory);
    if (randomMode) {
      return [...list].sort(() => Math.random() - 0.5);
    }
    return list;
  }, [activeCategory, randomMode]);

  return (
    <div className={cn('min-h-screen pb-16 transition-colors', isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Quote className={cn('w-6 h-6', isDark ? 'text-amber-400' : 'text-amber-500')} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">碎碎念</h1>
          <p className={cn('mt-2 text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
            生活碎片 · 真实记录 · 不是道理 · 共 {QUOTES.length} 条
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => {
            const count = cat === '全部' ? QUOTES.length : QUOTES.filter((q) => q.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
                    : isDark
                      ? 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}
              >
                {cat} {count}
              </button>
            );
          })}
          <button
            onClick={() => setRandomMode((v) => !v)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              randomMode
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-purple-500/30'
                : isDark
                  ? 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            随机
          </button>
        </div>

        {/* Quotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((q, i) => (
            <div
              key={`${q.text}-${i}`}
              className={cn(
                'group relative rounded-2xl p-6 border transition-all hover:-translate-y-0.5 hover:shadow-lg',
                isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200'
              )}
            >
              {/* Category badge */}
              <div className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r mb-3', CATEGORY_STYLES[q.category])}>
                {q.category}
              </div>

              {/* Text */}
              <p className="text-base leading-relaxed mb-3">
                {q.text}
              </p>

              {/* Author */}
              <div className={cn('text-sm text-right', isDark ? 'text-gray-400' : 'text-gray-500')}>
                —— {q.author}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={cn('text-center py-20 text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>
            暂无内容
          </div>
        )}
      </div>
    </div>
  );
}
