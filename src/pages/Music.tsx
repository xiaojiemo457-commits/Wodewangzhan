import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search, Play, Pause, Calendar, ChevronDown, Disc3, SkipForward, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, extractDominantColor, rgbToCss } from '../lib/utils';
import type { MusicEntry } from '../types';

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// 把外链音频 URL 通过本地代理转发，避免跨域(CORS/ORB)被浏览器拦截
function proxyAudioUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  // 已经是相对代理地址或本地路径，直接返回
  if (rawUrl.startsWith('/res-proxy') || rawUrl.startsWith('/api/')) return rawUrl;
  return `/res-proxy?url=${encodeURIComponent(rawUrl)}`;
}

export default function Music() {
  const { isDark, musicEntries, fetchMusic } = useStore();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState<[number, number, number] | null>(null);

  // 播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [seeking, setSeeking] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const skipOnErrorRef = useRef(false);

  useEffect(() => {
    fetchMusic();
  }, []);

  // 提取封面主色
  useEffect(() => {
    if (!playingId) { setDominantColor(null); return; }
    const current = musicEntries.find((m) => m.id === playingId);
    if (!current) { setDominantColor(null); return; }
    let cancelled = false;
    extractDominantColor(current.cover).then((rgb) => {
      if (!cancelled) setDominantColor(rgb);
    });
    return () => { cancelled = true; };
  }, [playingId, musicEntries]);

  const playingMusic = useMemo(
    () => musicEntries.find((m) => m.id === playingId) || null,
    [musicEntries, playingId]
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return musicEntries;
    return musicEntries.filter((m) =>
      m.title.toLowerCase().includes(kw) ||
      m.artist.toLowerCase().includes(kw) ||
      m.diary.toLowerCase().includes(kw)
    );
  }, [musicEntries, search]);

  const bgStyle = useMemo(() => {
    if (!dominantColor) return undefined;
    const c = rgbToCss(dominantColor, isDark ? 0.25 : 0.18);
    const c2 = rgbToCss(dominantColor, isDark ? 0.05 : 0.04);
    if (isDark) {
      return { background: `radial-gradient(120% 80% at 30% 0%, ${c} 0%, ${c2} 45%, #050505 100%)` };
    }
    return { background: `radial-gradient(120% 80% at 30% 0%, ${c} 0%, ${c2} 45%, #fafafa 100%)` };
  }, [dominantColor, isDark]);

  // 播放指定歌曲
  const playMusic = useCallback((m: MusicEntry) => {
    if (!m.url) {
      setErrorId(m.id);
      setTimeout(() => setErrorId(null), 2500);
      return;
    }
    setErrorId(null);
    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setPlayingId(m.id);
  }, []);

  const togglePlay = useCallback(() => {
    if (!playingMusic) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        setErrorId(playingMusic.id);
        setTimeout(() => setErrorId(null), 2500);
      });
    } else {
      audio.pause();
    }
  }, [playingMusic]);

  const playNext = useCallback(() => {
    if (!playingId) return;
    const idx = filtered.findIndex((m) => m.id === playingId);
    if (idx === -1) return;
    // 找下一首有 url 的
    for (let i = 1; i <= filtered.length; i++) {
      const next = filtered[(idx + i) % filtered.length];
      if (next.url) { playMusic(next); return; }
    }
  }, [playingId, filtered, playMusic]);

  // 切歌时设置 audio src（通过代理避免跨域/ORB）
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playingMusic) return;
    if (playingMusic.url) {
      // 先清空再设置，确保中止上一个请求
      audio.removeAttribute('src');
      audio.load();
      audio.src = proxyAudioUrl(playingMusic.url);
      audio.load();
      const p = audio.play();
      if (p) p.catch(() => {
        setErrorId(playingMusic.id);
        setTimeout(() => setErrorId(null), 2500);
      });
    }
  }, [playingMusic]);

  // audio 事件绑定
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => { setIsPlaying(true); setLoading(false); };
    const onPause = () => setIsPlaying(false);
    const onTime = () => { if (!seeking) setCurrentTime(audio.currentTime); };
    const onDur = () => setDuration(audio.duration);
    const onLoadStart = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onEnded = () => { if (!skipOnErrorRef.current) playNext(); };
    const onError = () => {
      setLoading(false);
      setIsPlaying(false);
      setErrorId(playingMusic?.id || null);
      // 自动跳下一首（避免卡住）
      skipOnErrorRef.current = true;
      setTimeout(() => {
        skipOnErrorRef.current = false;
        playNext();
      }, 1500);
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [seeking, playingMusic, playNext]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const progressRatio = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn('min-h-screen pb-32 transition-colors bg-color-transition', isDark ? 'text-gray-100' : 'text-gray-900')}
      style={bgStyle}
    >
      <audio ref={audioRef} preload="auto" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <Disc3 className={cn('w-7 h-7', isPlaying && 'vinyl-spinning')} />
            <h1 className="text-3xl font-bold tracking-tight">音乐日记</h1>
          </div>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>每一首歌都是一段记忆 · 点击封面开始播放</p>
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
                ? 'bg-gray-900/70 border-gray-800 text-gray-100 placeholder-gray-500 focus:border-sky-500 backdrop-blur-sm'
                : 'bg-white/70 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-500 backdrop-blur-sm'
            )}
          />
        </div>

        {filtered.length === 0 ? (
          <div className={cn('text-center py-20', isDark ? 'text-gray-500' : 'text-gray-400')}>暂无音乐日记</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((m, idx) => {
              const expanded = expandedId === m.id;
              const isCurrent = playingId === m.id;
              const hasNoUrl = !m.url;
              const showError = errorId === m.id;
              return (
                <div
                  key={m.id}
                  style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                  className={cn(
                    'animate-fade-in-up rounded-2xl p-4 border cursor-pointer transition-all duration-300',
                    isCurrent && 'ring-2 ring-sky-500/60 shadow-lg shadow-sky-500/10',
                    isDark
                      ? 'bg-gray-900/60 border-gray-800 hover:border-gray-700 backdrop-blur-md'
                      : 'bg-white/70 border-gray-100 hover:border-gray-300 backdrop-blur-md'
                  )}
                >
                  <div className="flex gap-4">
                    {/* Cover - 唱片样式 */}
                    <div className="relative shrink-0">
                      <div className={cn('relative w-[120px] h-[120px]', (isCurrent && isPlaying) && 'vinyl-spinning')}>
                        <div className="absolute inset-0 rounded-full bg-black/90 shadow-xl" />
                        <img
                          src={m.cover}
                          alt={m.title}
                          loading="lazy"
                          className="absolute inset-[6px] rounded-full object-cover"
                        />
                        <div className={cn('absolute inset-0 m-auto w-4 h-4 rounded-full', isDark ? 'bg-gray-950' : 'bg-gray-800')} />
                        <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-sky-500" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) togglePlay();
                          else playMusic(m);
                        }}
                        aria-label={isCurrent && isPlaying ? '暂停' : '播放'}
                        className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 hover:scale-110 transition-all"
                      >
                        {isCurrent && loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate text-lg">{m.title}</h3>
                          <p className={cn('text-sm truncate mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>{m.artist}</p>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 mt-1 shrink-0 transition-transform', expanded ? 'rotate-180' : '', isDark ? 'text-gray-400' : 'text-gray-400')} />
                      </div>

                      <div className={cn('overflow-hidden transition-all duration-300', expanded ? 'max-h-96' : 'max-h-12')}>
                        <p className={cn('text-sm mt-2 leading-relaxed diary-fade', isDark ? 'text-gray-300' : 'text-gray-600', !expanded && 'line-clamp-2')}>
                          {m.diary}
                        </p>
                      </div>

                      <div className={cn('flex items-center gap-1 text-xs mt-auto pt-2', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        <Calendar className="w-3 h-3" />
                        <span>{m.date}</span>
                        {isCurrent && isPlaying && (
                          <span className="ml-2 flex items-center gap-1 text-sky-500">
                            <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                            正在播放
                          </span>
                        )}
                        {isCurrent && loading && (
                          <span className="ml-2 text-amber-500">缓冲中…</span>
                        )}
                        {showError && (
                          <span className="ml-2 flex items-center gap-1 text-rose-500">
                            <AlertCircle className="w-3 h-3" />
                            {hasNoUrl ? '未配置音频链接' : '播放失败，跳过'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部固定播放条 */}
      {playingMusic && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up">
          <div className="mx-auto max-w-4xl mb-4 px-4">
            <div className={cn(
              'rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden',
              isDark ? 'bg-gray-900/85 border-gray-700' : 'bg-white/85 border-gray-200'
            )}>
              {/* 进度条 */}
              <div
                onClick={handleSeek}
                className={cn('h-1.5 cursor-pointer group relative', isDark ? 'bg-gray-800' : 'bg-gray-100')}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-sky-500 transition-[width] duration-150"
                  style={{ width: `${progressRatio}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-sky-500 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressRatio}% - 6px)` }}
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3">
                {/* 缩略封面 */}
                <div className={cn('relative w-12 h-12 shrink-0', isPlaying && 'vinyl-spinning')}>
                  <div className="absolute inset-0 rounded-full bg-black/90" />
                  <img src={playingMusic.cover} alt={playingMusic.title} className="absolute inset-[3px] rounded-full object-cover" />
                  <div className="absolute inset-0 m-auto w-2 h-2 rounded-full bg-sky-500" />
                </div>

                {/* 标题 */}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{playingMusic.title}</p>
                  <p className={cn('text-xs truncate', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    {playingMusic.artist} · {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>

                {/* 控制按钮 */}
                <button
                  onClick={playNext}
                  aria-label="下一首"
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                    isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  )}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? '暂停' : '播放'}
                  className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
