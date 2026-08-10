import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Send, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import FluidBackground from '../components/effects/FluidBackground';

interface FormState {
  name: string;
  url: string;
  description: string;
}

interface Status {
  type: 'idle' | 'success' | 'error';
  message: string;
}

export default function Home() {
  const isDark = useStore((s) => s.isDark);
  const friendLinks = useStore((s) => s.friendLinks);
  const fetchFriendLinks = useStore((s) => s.fetchFriendLinks);
  const addFriendLink = useStore((s) => s.addFriendLink);

  const [form, setForm] = useState<FormState>({ name: '', url: '', description: '' });
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFriendLinks();
  }, [fetchFriendLinks]);

  const approvedLinks = friendLinks.filter((l) => l.status === 'approved');

  const safeUrl = (url: string) => (url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setStatus({ type: 'error', message: '请填写站点名称和链接' });
      return;
    }
    setSubmitting(true);
    setStatus({ type: 'idle', message: '' });
    try {
      await addFriendLink({
        name: form.name.trim(),
        url: form.url.trim(),
        description: form.description.trim() || undefined,
        isAdmin: false,
      });
      setStatus({ type: 'success', message: '提交成功，等待管理员审核中。' });
      setForm({ name: '', url: '', description: '' });
    } catch {
      setStatus({ type: 'error', message: '提交失败，请稍后再试。' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn('relative min-h-screen', isDark ? 'text-white' : 'text-gray-900')}>
      {/* Full-page fluid background */}
      <FluidBackground isDark={isDark} />

      {/* ===== Hero ===== */}
      <section className="relative z-10 flex h-screen items-center justify-center overflow-hidden px-6">
        <div className="animate-fade-in-up relative z-10 flex flex-col items-center text-center px-6">
          <p
            className={cn(
              'mb-6 text-xs tracking-[0.4em] uppercase sm:text-sm',
              isDark ? 'text-white/40' : 'text-gray-400'
            )}
          >
            — A Personal Space —
          </p>
          <h1
            className={cn(
              'mb-6 text-4xl font-bold leading-tight sm:text-6xl md:text-7xl lg:text-8xl',
              isDark ? 'text-white' : 'text-gray-900'
            )}
            style={{ letterSpacing: '-0.02em' }}
          >
            用心记录
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #feca57 100%)',
              }}
            >
              生活的每一刻
            </span>
          </h1>
          <p
            className={cn(
              'mb-10 max-w-xl text-base leading-relaxed sm:text-lg',
              isDark ? 'text-white/50' : 'text-gray-500'
            )}
          >
            在文字里修行，在时光中沉淀。
            <br />
            关于技术、生活、阅读、旅行与思考的私人笔记。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/thoughts"
              className={cn(
                'group relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5',
                isDark
                  ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10'
                  : 'bg-black text-white hover:bg-black/90 shadow-lg shadow-black/20'
              )}
            >
              <span>浏览日记</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/about"
              className={cn(
                'inline-flex items-center gap-2 rounded-full border-2 px-8 py-3.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5',
                isDark
                  ? 'border-white/20 text-white hover:border-white/40 hover:bg-white/5'
                  : 'border-black/20 text-gray-900 hover:border-black/40 hover:bg-black/5'
              )}
            >
              关于我
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <svg
            className={cn('w-6 h-6', isDark ? 'text-white/30' : 'text-gray-300')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ===== Content sections on fluid background ===== */}
      <div className="relative z-10">
        {/* ===== Friend Links ===== */}
        <section className="relative py-24 overflow-hidden">
          {/* Section background decoration */}
          <div
            className={cn(
              'absolute inset-0 pointer-events-none',
              isDark
                ? 'bg-gradient-to-b from-transparent via-white/[0.02] to-transparent'
                : 'bg-gradient-to-b from-transparent via-gray-50 to-transparent'
            )}
          />

          <div className="relative mx-auto max-w-5xl px-6">
            <div className="mb-14 text-center">
              <p
                className={cn(
                  'mb-4 text-xs tracking-[0.3em] uppercase',
                  isDark ? 'text-white/30' : 'text-gray-400'
                )}
              >
                — Friend Links —
              </p>
              <h2
                className={cn(
                  'text-4xl font-bold sm:text-5xl',
                  isDark ? 'text-white' : 'text-gray-900'
                )}
                style={{ letterSpacing: '-0.02em' }}
              >
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: isDark
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  }}
                >
                  友情链接
                </span>
              </h2>
              <p className={cn('mt-4 text-base', isDark ? 'text-white/40' : 'text-gray-500')}>
                与有趣的灵魂相遇，记录彼此的足迹
              </p>
            </div>

            {approvedLinks.length > 0 ? (
              <div className="mb-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {approvedLinks.map((link, idx) => (
                  <a
                    key={link.id}
                    href={safeUrl(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'group relative flex items-start gap-4 rounded-2xl border p-5 transition-all duration-500 hover:-translate-y-1 backdrop-blur-xl',
                      isDark
                        ? 'border-white/[0.15] bg-white/[0.08] hover:bg-white/[0.14] hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20'
                        : 'border-white/80 bg-white/50 hover:bg-white/65 hover:shadow-xl hover:shadow-gray-300/60 hover:border-white'
                    )}
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {/* Icon circle */}
                    <div
                      className={cn(
                        'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-500',
                        isDark
                          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300 group-hover:from-indigo-500/40 group-hover:to-purple-500/40'
                          : 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 group-hover:from-indigo-100 group-hover:to-purple-100'
                      )}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          'mb-1 truncate font-semibold transition-colors',
                          isDark
                            ? 'text-white group-hover:text-indigo-300'
                            : 'text-gray-900 group-hover:text-indigo-600'
                        )}
                      >
                        {link.name}
                      </h3>
                      <p className={cn('line-clamp-2 text-sm leading-relaxed', isDark ? 'text-white/40' : 'text-gray-500')}>
                        {link.description || '暂无描述'}
                      </p>
                    </div>

                    <ExternalLink
                      size={16}
                      className={cn(
                        'mt-1 flex-shrink-0 transition-all duration-300',
                        isDark
                          ? 'text-white/30 group-hover:text-indigo-300 group-hover:translate-x-0.5'
                          : 'text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5'
                      )}
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  'mb-16 rounded-2xl border border-dashed p-16 text-center',
                  isDark ? 'border-white/10 text-white/30' : 'border-gray-200 text-gray-400'
                )}
              >
                暂无友链，欢迎成为第一个。
              </div>
            )}

            {/* Friend link submission form */}
            <div
              className={cn(
                'mx-auto max-w-2xl rounded-3xl border p-8 shadow-xl transition-shadow backdrop-blur-xl',
                isDark
                  ? 'border-white/[0.15] bg-white/[0.08] shadow-black/30'
                  : 'border-white/80 bg-white/50 shadow-gray-300/60'
              )}
            >
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl',
                    isDark
                      ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-300'
                      : 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600'
                  )}
                >
                  <Send size={18} />
                </div>
                <h3 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  申请友链
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      className={cn('mb-2 block text-sm font-medium', isDark ? 'text-white/60' : 'text-gray-700')}
                      htmlFor="fl-name"
                    >
                      站点名称
                    </label>
                    <input
                      id="fl-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="我的博客"
                      className={cn(
                        'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2',
                        isDark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                          : 'border-white/80 bg-white/50 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-100 focus:bg-white/80'
                      )}
                    />
                  </div>
                  <div>
                    <label
                      className={cn('mb-2 block text-sm font-medium', isDark ? 'text-white/60' : 'text-gray-700')}
                      htmlFor="fl-url"
                    >
                      站点链接
                    </label>
                    <input
                      id="fl-url"
                      type="text"
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      placeholder="https://example.com"
                      className={cn(
                        'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2',
                        isDark
                          ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                          : 'border-white/80 bg-white/50 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-100 focus:bg-white/80'
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={cn('mb-2 block text-sm font-medium', isDark ? 'text-white/60' : 'text-gray-700')}
                    htmlFor="fl-desc"
                  >
                    站点描述
                  </label>
                  <textarea
                    id="fl-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="一句话介绍你的站点"
                    className={cn(
                      'w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:ring-2',
                      isDark
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                        : 'border-white/80 bg-white/50 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-indigo-100 focus:bg-white/80'
                    )}
                  />
                </div>

                {status.type !== 'idle' && (
                  <p
                    className={cn(
                      'text-sm',
                      status.type === 'success'
                        ? isDark ? 'text-green-400' : 'text-green-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    )}
                  >
                    {status.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
                    isDark
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                  )}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? '提交中…' : '提交申请'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
