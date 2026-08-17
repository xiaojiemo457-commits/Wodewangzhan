import { create } from 'zustand';
import { Article, Tool, Photo, MusicEntry, Category, FriendLink, TimelineEvent, AboutData } from '../types';
import * as api from '../services/api';

interface AppState {
  // 主题
  theme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // 管理员
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;

  // 全局错误（不再静默吞掉异常）
  lastError: string | null;
  clearError: () => void;

  // 文章
  articles: Article[];
  loadingArticles: boolean;
  fetchArticles: (params?: { category?: string; search?: string; page?: number }) => Promise<{ total: number; page: number; totalPages: number }>;
  getArticleById: (id: string) => Article | undefined;

  // 分类
  categories: Category[];

  // 工具
  tools: Tool[];
  fetchTools: () => Promise<void>;
  addTool: (tool: Tool) => void;
  updateTool: (id: string, updates: Partial<Tool>) => void;
  deleteTool: (id: string) => void;

  // 照片
  photos: Photo[];
  fetchPhotos: () => Promise<void>;

  // 音乐日记
  musicEntries: MusicEntry[];
  fetchMusic: () => Promise<void>;

  // 友链
  friendLinks: FriendLink[];
  fetchFriendLinks: () => Promise<void>;
  addFriendLink: (data: { name: string; url: string; description?: string; isAdmin: boolean }) => Promise<void>;
  approveFriendLink: (id: string) => Promise<void>;
  rejectFriendLink: (id: string) => Promise<void>;
  deleteFriendLink: (id: string) => Promise<void>;

  // 站点设置
  siteSettings: api.SiteSettings | null;
  fetchSiteSettings: () => Promise<void>;

  // 时间轴
  timelineEvents: TimelineEvent[];
  fetchTimeline: () => Promise<void>;
  addTimelineEvent: (data: Partial<TimelineEvent>) => Promise<void>;
  updateTimelineItem: (id: string, data: Partial<TimelineEvent>) => Promise<void>;
  removeTimelineEvent: (id: string) => Promise<void>;

  // 关于页
  about: AboutData | null;
  fetchAbout: () => Promise<void>;
  updateAboutPage: (data: Partial<AboutData>) => Promise<void>;

  // 命令面板
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
}

/** 记录错误到控制台并写入 store，供 UI 展示（不再静默吞掉） */
function reportError(set: (p: Partial<AppState>) => void, e: unknown) {
  console.error('[store]', e);
  set({ lastError: e instanceof Error ? e.message : '请求失败，请稍后重试' });
}

const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  document.body.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';
};

export const categories: Category[] = [
  { id: '1', name: '技术', slug: 'tech' },
  { id: '2', name: '生活', slug: 'life' },
  { id: '3', name: '阅读', slug: 'reading' },
  { id: '4', name: '旅行', slug: 'travel' },
  { id: '5', name: '思考', slug: 'thought' },
  { id: '6', name: '爱情', slug: 'love' },
];

// Vite HMR 持久化：防止热更新时创建新的 store 实例导致组件订阅失效
const hmr = (import.meta as any).hot;

function _create() {
  return create<AppState>((set, get) => {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  return {
    theme: initialTheme,
    isDark: initialTheme === 'dark',
    setTheme: (mode) => {
      applyTheme(mode);
      localStorage.setItem('theme', mode);
      set({ theme: mode, isDark: mode === 'dark' });
    },
    toggleTheme: () => {
      const { theme, setTheme } = get();
      setTheme(theme === 'light' ? 'dark' : 'light');
    },

    isAdmin: false,
    setIsAdmin: (v) => set({ isAdmin: v }),

    lastError: null,
    clearError: () => set({ lastError: null }),

    articles: [],
    loadingArticles: false,
    fetchArticles: async (params) => {
      set({ loadingArticles: true });
      try {
        const result = await api.fetchArticles(params);
        set({ articles: result.items, loadingArticles: false });
        return { total: result.total, page: result.page, totalPages: result.totalPages };
      } catch (e) {
        set({ loadingArticles: false });
        reportError(set, e);
        return { total: 0, page: 1, totalPages: 0 };
      }
    },
    getArticleById: (id) => get().articles.find((a) => a.id === id),

    categories,

    tools: [],
    fetchTools: async () => {
      try {
        const tools = await api.fetchTools();
        set({ tools });
      } catch (e) { reportError(set, e); }
    },
    addTool: (tool) => set((s) => ({ tools: [...s.tools, tool] })),
    updateTool: (id, updates) => set((s) => ({ tools: s.tools.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
    deleteTool: (id) => set((s) => ({ tools: s.tools.filter((t) => t.id !== id) })),

    photos: [],
    fetchPhotos: async () => {
      try {
        const photos = await api.fetchPhotos();
        set({ photos });
      } catch (e) { reportError(set, e); }
    },

    musicEntries: [],
    fetchMusic: async () => {
      try {
        const music = await api.fetchMusic();
        set({ musicEntries: music });
      } catch (e) { reportError(set, e); }
    },

    friendLinks: [],
    fetchFriendLinks: async () => {
      try {
        const result = await api.fetchFriendLinks();
        set({ friendLinks: result.all });
      } catch (e) { reportError(set, e); }
    },
    addFriendLink: async (data) => {
      try {
        const result = await api.addFriendLink(data);
        set((s) => ({ friendLinks: [...s.friendLinks, result.link] }));
      } catch (e) { reportError(set, e); }
    },
    approveFriendLink: async (id) => {
      try {
        await api.approveFriendLink(id);
        set((s) => ({ friendLinks: s.friendLinks.map((l) => (l.id === id ? { ...l, status: 'approved' as const } : l)) }));
      } catch (e) { reportError(set, e); }
    },
    rejectFriendLink: async (id) => {
      try {
        await api.rejectFriendLink(id);
        set((s) => ({ friendLinks: s.friendLinks.map((l) => (l.id === id ? { ...l, status: 'rejected' as const } : l)) }));
      } catch (e) { reportError(set, e); }
    },
    deleteFriendLink: async (id) => {
      try {
        await api.deleteFriendLink(id);
        set((s) => ({ friendLinks: s.friendLinks.filter((l) => l.id !== id) }));
      } catch (e) { reportError(set, e); }
    },

    commandPaletteOpen: false,
    setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),

    siteSettings: null,
    fetchSiteSettings: async () => {
      try {
        const settings = await api.getSettings();
        set({ siteSettings: settings });
      } catch (e) { reportError(set, e); }
    },

    timelineEvents: [],
    fetchTimeline: async () => {
      try {
        const items = await api.fetchTimeline();
        set({ timelineEvents: items });
      } catch (e) { reportError(set, e); }
    },
    addTimelineEvent: async (data) => {
      try {
        const res = await api.createTimelineEvent(data);
        set((s) => ({ timelineEvents: [...s.timelineEvents, res.item] }));
      } catch (e) { reportError(set, e); }
    },
    updateTimelineItem: async (id, data) => {
      try {
        const res = await api.updateTimelineEvent(id, data);
        set((s) => ({ timelineEvents: s.timelineEvents.map((t) => (t.id === id ? res.item : t)) }));
      } catch (e) { reportError(set, e); }
    },
    removeTimelineEvent: async (id) => {
      try {
        await api.deleteTimelineEvent(id);
        set((s) => ({ timelineEvents: s.timelineEvents.filter((t) => t.id !== id) }));
      } catch (e) { reportError(set, e); }
    },

    about: null,
    fetchAbout: async () => {
      try {
        const about = await api.fetchAbout();
        set({ about });
      } catch (e) { reportError(set, e); }
    },
    updateAboutPage: async (data) => {
      try {
        const res = await api.updateAbout(data);
        set({ about: res.about });
      } catch (e) { reportError(set, e); }
    },
  };
  });
}

export const useStore: ReturnType<typeof _create> = hmr?.data?.useStore ?? _create();

if (hmr) {
  hmr.dispose((data: any) => {
    data.useStore = useStore;
  });
}
