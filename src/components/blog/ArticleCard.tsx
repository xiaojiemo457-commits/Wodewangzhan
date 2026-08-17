import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import type { Article } from '../../types';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface ArticleCardProps {
  article: Article;
  variant?: 'grid' | 'list' | 'timeline';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ArticleCard({ article, variant = 'grid' }: ArticleCardProps) {
  const categories = useStore((s) => s.categories);

  const categoryName =
    article.category?.name ??
    categories.find((c) => String(c.id) === String(article.category_id))?.name ??
    '';

  const detailLink = `/thoughts/${article.id}`;

  const cover = article.cover_image ? (
    <img
      src={article.cover_image}
      alt={article.title}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  ) : (
    <div className="h-full w-full bg-gradient-to-br from-black/5 to-black/10 dark:from-white/10 dark:to-white/5" />
  );

  const dateNode = (
    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/40">
      <Calendar size={12} />
      <span>{formatDate(article.created_at)}</span>
    </div>
  );

  const categoryBadge = categoryName ? (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-black/5 text-gray-600 dark:bg-white/10 dark:text-white/80">
      {categoryName}
    </span>
  ) : null;

  // ===== Grid variant =====
  if (variant === 'grid') {
    return (
      <Link
        to={detailLink}
        className="group block overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-black/5 bg-white hover:shadow-black/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] dark:hover:shadow-black/40"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          {cover}
          {categoryBadge && (
            <span className="absolute left-3 top-3">
              <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-md">
                {categoryName}
              </span>
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold transition-colors text-gray-900 dark:text-white">
            {article.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/60">
            {article.summary}
          </p>
          {dateNode}
        </div>
      </Link>
    );
  }

  // ===== List variant =====
  if (variant === 'list') {
    return (
      <Link
        to={detailLink}
        className="group flex gap-5 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg border-black/5 bg-white hover:shadow-black/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
      >
        <div className="relative h-28 w-[200px] flex-shrink-0 overflow-hidden rounded-xl sm:h-32">
          {cover}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-2 flex items-center gap-2">
            {categoryBadge}
            {dateNode}
          </div>
          <h3 className="mb-1.5 line-clamp-1 text-lg font-semibold transition-colors text-gray-900 dark:text-white">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/60">
            {article.summary}
          </p>
        </div>
      </Link>
    );
  }

  // ===== Timeline variant =====
  return (
    <div className="relative">
      <span className="absolute -left-6 top-6 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-black bg-black dark:border-white dark:bg-white" />
      <Link
        to={detailLink}
        className="group flex gap-5 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg border-black/5 bg-white hover:shadow-black/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
      >
        <div className="relative h-24 w-[160px] flex-shrink-0 overflow-hidden rounded-xl sm:h-28">
          {cover}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-1.5 flex items-center gap-2">
            {categoryBadge}
            {dateNode}
          </div>
          <h3 className="mb-1 line-clamp-1 text-base font-semibold transition-colors text-gray-900 dark:text-white">
            {article.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-white/60">
            {article.summary}
          </p>
        </div>
      </Link>
    </div>
  );
}
