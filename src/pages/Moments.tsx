import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import Lightbox from '../components/moments/Lightbox';

export default function Moments() {
  const { isDark, photos, fetchPhotos } = useStore();
  const [year, setYear] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const years = useMemo(() => {
    const set = new Set<number>();
    photos.forEach((p) => set.add(p.year));
    return ['All', ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [photos]);

  const filtered = useMemo(() => {
    if (year === 'All') return photos;
    return photos.filter((p) => String(p.year) === year);
  }, [photos, year]);

  return (
    <div className={cn('min-h-screen pb-16 transition-colors', isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">瞬间</h1>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>用镜头记录生活的点滴</p>
        </div>

        {/* Year filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                year === y
                  ? 'bg-sky-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {y === 'All' ? '全部' : y}
            </button>
          ))}
        </div>

        {/* Masonry */}
        {filtered.length === 0 ? (
          <div className={cn('text-center py-20', isDark ? 'text-gray-500' : 'text-gray-400')}>暂无照片</div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {filtered.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(idx)}
                className="break-inside-avoid mb-4 group relative overflow-hidden rounded-2xl cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  loading="lazy"
                  className="w-full block transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <h3 className="text-white font-medium text-sm">{photo.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={filtered}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(i: number) => setLightboxIndex(i)}
        />
      )}
    </div>
  );
}
