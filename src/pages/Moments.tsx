import { useEffect, useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import Lightbox from '../components/moments/Lightbox';

/**
 * 瞬间 - 照片墙页面
 * 按年份分组展示，支持点击放大浏览（Lightbox）
 */
export default function Moments() {
  const photos = useStore((s) => s.photos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!photos.length) useStore.getState().fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 按年份降序分组
  const grouped = useMemo(() => {
    const map = new Map<number, typeof photos>();
    for (const p of [...photos].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))) {
      const year = p.year || new Date(p.created_at).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [photos]);

  const total = photos.length;

  return (
    <div className="min-h-screen transition-colors bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 页头 */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 mb-4">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">瞬间</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {total > 0 ? `${total} 个被定格的瞬间` : '加载中...'}
          </p>
        </header>

        {/* 年份分组照片墙 */}
        {grouped.map(([year, list]) => (
          <section key={year} className="mb-12">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-3 text-gray-800 dark:text-gray-200">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold">
                {year}
              </span>
              <span className="text-sm text-gray-400">{list.length} 张</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {list.map((photo, i) => {
                const globalIndex = photos.indexOf(photo);
                return (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIndex(globalIndex)}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800 focus-visible:outline-2 focus-visible:outline-amber-500"
                    aria-label={`查看照片：${photo.title}`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-2 left-2 right-2 text-left text-white text-xs font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* 空状态 */}
        {total === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">还没有照片，先去后台添加吧</p>
          </div>
        )}
      </div>

      {/* 灯箱 */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
