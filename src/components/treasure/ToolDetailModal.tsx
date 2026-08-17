import { useEffect } from 'react';
import { X, ExternalLink, MousePointerClick } from 'lucide-react';
import { Tool } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  tool: Tool | null;
  onClose: () => void;
  onVisit: (tool: Tool) => void;
}

const ICON_COLORS = [
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
];

const getIconColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ICON_COLORS[Math.abs(hash) % ICON_COLORS.length];
};

const getLocalClicks = (id: string): number => {
  try {
    const data = JSON.parse(localStorage.getItem('tool_clicks') || '{}');
    return data[id] || 0;
  } catch {
    return 0;
  }
};

export default function ToolDetailModal({ tool, onClose, onVisit }: Props) {
  useEffect(() => {
    if (!tool) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [tool, onClose]);

  if (!tool) return null;

  const clickCount = (tool.clicks || 0) + getLocalClicks(tool.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
      >
        <button
          onClick={onClose}
          aria-label="关闭"
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4 pr-8">
          <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0', getIconColor(tool.name))}>
            {tool.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{tool.name}</h2>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {tool.category}
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4 text-gray-600 dark:text-gray-300">
          {tool.description}
        </p>

        <div className="flex items-center gap-2 text-sm mb-6 text-gray-500 dark:text-gray-400">
          <MousePointerClick className="w-4 h-4" />
          <span>访问次数：{clickCount}</span>
        </div>

        <button
          onClick={() => onVisit(tool)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors"
        >
          <ExternalLink className="w-5 h-5" /> 访问站点
        </button>
      </div>
    </div>
  );
}
