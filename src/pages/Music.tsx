import { useEffect, useMemo, useState } from 'react';
import { Search, Play, Calendar, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export default function Music() {
  const { isDark, musicEntries, fetchMusic } = useStore();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMusic();
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return musicEntries;
    return musicEntries.filter((m) =>
      m.title.toLowerCase().includes(kw) ||
      m.artist.toLowerCase().includes(kw) ||
      m.diary.toLowerCase().includes(kw)
    );
  }, [musicEntries, search]);

  return (
    <div className={cn('min-h-screen pb-16 transition-colors', isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">音乐日记</h1>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>每一首歌都是一段记忆</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className={cn('absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5', isDark ? 'text-gray-500' : 'text-gray-400')} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索歌曲、歌手或日记..."
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-colors',
              isDark
                ? 'bg-gray-900 border-gray-800 text-gray-100 placeholder-gray-500 focus:border-sky-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500'
            )}
          />
        </div>

        {filtered.length === 0 ? (
          <div className={cn('text-center py-20', isDark ? 'text-gray-500' : 'text-gray-400')}>暂无音乐日记</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m) => {
              const expanded = expandedId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  className={cn(
                    'rounded-2xl p-4 border cursor-pointer transition-colors',
                    isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-gray-100 hover:border-gray-200'
                  )}
                >
                  <div className="flex gap-4">
                    {/* Cover */}
                    <div className="relative shrink-0">
                      <img
                        src={m.cover}
                        alt={m.title}
                        loading="lazy"
                        className="w-[120px] h-[120px] rounded-xl object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (m.url) window.open(m.url, '_blank', 'noopener,noreferrer');
                        }}
                        aria-label="播放"
                        className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <Play className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{m.title}</h3>
                          <p className={cn('text-sm truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>{m.artist}</p>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 mt-1 shrink-0 transition-transform', expanded ? 'rotate-180' : '', isDark ? 'text-gray-400' : 'text-gray-400')} />
                      </div>

                      <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-96' : 'max-h-12')}>
                        <p className={cn('text-sm mt-2 leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-600', !expanded && 'line-clamp-2')}>
                          {m.diary}
                        </p>
                      </div>

                      <div className={cn('flex items-center gap-1 text-xs mt-auto pt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        <Calendar className="w-3 h-3" />
                        <span>{m.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
