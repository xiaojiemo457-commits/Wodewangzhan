import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo } from '../../types';

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export default function Lightbox({ photos, index, onClose, onNavigate }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      else if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, photos.length, onClose, onNavigate]);

  if (!photos.length) return null;
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 animate-fade-in p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        aria-label="关闭"
        className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm select-none">
        {index + 1} / {photos.length}
      </div>

      {/* Left arrow */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
          aria-label="上一张"
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {/* Right arrow */}
      {index < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
          aria-label="下一张"
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center max-w-5xl w-full"
      >
        <img
          src={photo.url}
          alt={photo.title}
          className="max-h-[80vh] max-w-full object-contain rounded-lg"
        />
        <div className="mt-4 text-center max-w-2xl">
          <h3 className="text-white font-semibold text-lg">{photo.title}</h3>
          {photo.description && (
            <p className="text-white/60 text-sm mt-1">{photo.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
