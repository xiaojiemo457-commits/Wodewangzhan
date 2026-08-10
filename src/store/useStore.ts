import { create } from 'zustand';
import { Article, Tool, Photo, MusicEntry, Category, FriendLink } from '../types';
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

  // 命令面板
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;
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

export const useStore = create<AppState>((set, get) => {
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

    articles: [],
    loadingArticles: false,
    fetchArticles: async (params) => {
      set({ loadingArticles: true });
      try {
        const result = await api.fetchArticles(params);
        set({ articles: result.items, loadingArticles: false });
        return { total: result.total, page: result.page, totalPages: result.totalPages };
      } catch {
        set({ loadingArticles: false });
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
      } catch { /* noop */ }
    },
    addTool: (tool) => set((s) => ({ tools: [...s.tools, tool] })),
    updateTool: (id, updates) => set((s) => ({ tools: s.tools.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
    deleteTool: (id) => set((s) => ({ tools: s.tools.filter((t) => t.id !== id) })),

    photos: [],
    fetchPhotos: async () => {
      try {
        const photos = await api.fetchPhotos();
        set({ photos });
      } catch { /* noop */ }
    },

    musicEntries: [],
    fetchMusic: async () => {
      try {
        const music = await api.fetchMusic();
        set({ musicEntries: music });
      } catch { /* noop */ }
    },

    friendLinks: [],
    fetchFriendLinks: async () => {
      try {
        const result = await api.fetchFriendLinks();
        set({ friendLinks: result.all });
      } catch { /* noop */ }
    },
    addFriendLink: async (data) => {
      try {
        const result = await api.addFriendLink(data);
        set((s) => ({ friendLinks: [...s.friendLinks, result.link] }));
      } catch { /* noop */ }
    },
    approveFriendLink: async (id) => {
      try {
        await api.approveFriendLink(id);
        set((s) => ({ friendLinks: s.friendLinks.map((l) => (l.id === id ? { ...l, status: 'approved' as const } : l)) }));
      } catch { /* noop */ }
    },
    rejectFriendLink: async (id) => {
      try {
        await api.rejectFriendLink(id);
        set((s) => ({ friendLinks: s.friendLinks.map((l) => (l.id === id ? { ...l, status: 'rejected' as const } : l)) }));
      } catch { /* noop */ }
    },
    deleteFriendLink: async (id) => {
      try {
        await api.deleteFriendLink(id);
        set((s) => ({ friendLinks: s.friendLinks.filter((l) => l.id !== id) }));
      } catch { /* noop */ }
    },

    commandPaletteOpen: false,
    setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
  };
});
