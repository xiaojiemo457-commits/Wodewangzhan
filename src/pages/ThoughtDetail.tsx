import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Eye, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import * as api from '../services/api';
import type { Article } from '../types';
import ReadingProgress from '../components/blog/ReadingProgress';
import TableOfContents from '../components/blog/TableOfContents';
import ArticleCard from '../components/blog/ArticleCard';
import { cn } from '../lib/utils';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractText(node: ReactNode): string {
  if (node == null || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return extractText(props?.children);
  }
  return '';
}

export default function ThoughtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categories = useStore((s) => s.categories);
  const articles = useStore((s) => s.articles);
  const fetchArticles = useStore((s) => s.fetchArticles);

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setNotFound(false);
      setArticle(null);
      window.scrollTo(0, 0);

      const fromStore = useStore.getState().getArticleById(id);
      if (fromStore) {
        setArticle(fromStore);
        setLoading(false);
        return;
      }
      try {
        const res = await api.fetchArticleById(id);
        if (cancelled) return;
        setArticle(res.article);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Ensure we have articles loaded for the related section
  useEffect(() => {
    if (articles.length === 0) {
      fetchArticles({ page: 1 });
    }
  }, [articles.length, fetchArticles]);

  const categoryName = useMemo(() => {
    if (!article) return '';
    return (
      article.category?.name ??
      categories.find((c) => String(c.id) === String(article.category_id))?.name ??
      ''
    );
  }, [article, categories]);

  const related = useMemo(() => {
    if (!article) return [];
    return articles
      .filter((a) => a.id !== article.id && String(a.category_id) === String(article.category_id))
      .slice(0, 3);
  }, [article, articles]);

  // 预处理正文：把所有换行统一为双换行（Markdown 段落分隔），
  // 避免单换行被渲染成同一段导致文字密密麻麻挤在一起
  const formattedContent = useMemo(() => {
    if (!article?.content) return '';
    return article.content
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join('\n\n');
  }, [article?.content]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-400 dark:text-white/40">
        加载中…
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-3 text-5xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-white/50">文章未找到</p>
        <button
          type="button"
          onClick={() => navigate('/thoughts')}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          <ArrowLeft size={16} />
          返回日记
        </button>
      </div>
    );
  }

  return (
    <div className="text-gray-900 dark:text-white">
      <ReadingProgress />

      {/* Back button */}
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm transition-colors text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          返回日记
        </button>
      </div>

      {/* Cover image with title overlay */}
      <div className="relative mt-4 max-h-[400px] w-full overflow-hidden">
        {article.cover_image ? (
          <img
            src={article.cover_image}
            alt={article.title}
            className="h-full max-h-[400px] w-full object-cover"
          />
        ) : (
          <div className="h-[300px] w-full sm:h-[400px] bg-gradient-to-br from-black/10 to-black/[0.02] dark:from-white/10 dark:to-white/[0.02]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-8 sm:px-6">
          {categoryName && (
            <span className="mb-3 inline-flex items-center rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium text-white backdrop-blur-md">
              {categoryName}
            </span>
          )}
          <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl md:text-4xl">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(article.created_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={14} />
              {article.views ?? 0} 次阅读
            </span>
          </div>
        </div>
      </div>

      {/* Body: TOC + content */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <TableOfContents content={article.content} />
          </aside>
          <article className="prose max-w-none text-gray-800 [&_code]:bg-black/5 [&_pre]:bg-black/[0.03] [&_a]:text-gray-900 [&_blockquote]:border-gray-400 dark:text-white/90 dark:[&_code]:bg-white/10 dark:[&_pre]:bg-white/5 dark:[&_a]:text-white dark:[&_blockquote]:border-white/40">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => {
                  const text = extractText(children);
                  return <h2 id={slugify(text)} className="scroll-mt-24">{children}</h2>;
                },
                h3: ({ children }) => {
                  const text = extractText(children);
                  return <h3 id={slugify(text)} className="scroll-mt-24">{children}</h3>;
                },
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">相关文章</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
