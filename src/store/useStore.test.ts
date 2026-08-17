// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStore, categories } from './useStore';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  fetchArticles: vi.fn(),
  fetchTools: vi.fn(),
  fetchPhotos: vi.fn(),
  fetchMusic: vi.fn(),
  fetchFriendLinks: vi.fn(),
  addFriendLink: vi.fn(),
  approveFriendLink: vi.fn(),
  rejectFriendLink: vi.fn(),
  deleteFriendLink: vi.fn(),
  getSettings: vi.fn(),
  fetchTimeline: vi.fn(),
  createTimelineEvent: vi.fn(),
  updateTimelineEvent: vi.fn(),
  deleteTimelineEvent: vi.fn(),
  fetchAbout: vi.fn(),
  updateAbout: vi.fn(),
}));

const mockedApi = vi.mocked(api);

/** 让某个 api 调用失败（Error 分支） */
function rejectWithError(fn: keyof typeof api, msg = 'network down') {
  (mockedApi[fn] as any).mockRejectedValueOnce(new Error(msg));
}

/** 让某个 api 调用失败（非 Error 分支，验证 lastError 兜底文案） */
function rejectWithPlain(fn: keyof typeof api) {
  (mockedApi[fn] as any).mockRejectedValueOnce('boom');
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // replace=true 完整重置为初始状态（含全部 actions），避免测试间串扰
  useStore.setState(useStore.getInitialState(), true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('初始主题', () => {
  it('localStorage 无记录时回退 light', () => {
    expect(useStore.getState().theme).toBe('light');
    expect(useStore.getState().isDark).toBe(false);
  });

  it('localStorage 无效值时回退 light', async () => {
    localStorage.setItem('theme', 'garbage');
    vi.resetModules();
    const mod = await import('./useStore');
    expect(mod.useStore.getState().theme).toBe('light');
  });

  it('读取 localStorage 保存的 dark 主题', async () => {
    localStorage.setItem('theme', 'dark');
    vi.resetModules();
    const mod = await import('./useStore');
    expect(mod.useStore.getState().isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

describe('主题切换', () => {
  it('setTheme 更新状态、localStorage 与 html class', () => {
    useStore.getState().setTheme('dark');
    let s = useStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.isDark).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.style.backgroundColor).toBe('rgb(0, 0, 0)');

    useStore.getState().setTheme('light');
    s = useStore.getState();
    expect(s.theme).toBe('light');
    expect(s.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.body.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('toggleTheme 在明暗之间切换', () => {
    useStore.getState().setTheme('light');
    useStore.getState().toggleTheme();
    expect(useStore.getState().isDark).toBe(true);
    useStore.getState().toggleTheme();
    expect(useStore.getState().isDark).toBe(false);
  });
});

describe('基础状态', () => {
  it('setIsAdmin / clearError / setCommandPaletteOpen', () => {
    useStore.getState().setIsAdmin(true);
    expect(useStore.getState().isAdmin).toBe(true);

    useStore.setState({ lastError: 'x' });
    useStore.getState().clearError();
    expect(useStore.getState().lastError).toBeNull();

    useStore.getState().setCommandPaletteOpen(true);
    expect(useStore.getState().commandPaletteOpen).toBe(true);
  });

  it('导出固定分类', () => {
    expect(categories).toHaveLength(6);
    expect(categories[0].slug).toBe('tech');
  });
});

describe('文章', () => {
  const listResult = {
    items: [{ id: 'a1', title: 'A' }],
    total: 1,
    page: 1,
    totalPages: 1,
  };

  it('fetchArticles 成功写入列表并返回分页信息', async () => {
    mockedApi.fetchArticles.mockResolvedValueOnce(listResult as any);
    const r = await useStore.getState().fetchArticles({ page: 1 });
    expect(r).toEqual({ total: 1, page: 1, totalPages: 1 });
    expect(useStore.getState().articles).toEqual(listResult.items);
    expect(useStore.getState().loadingArticles).toBe(false);
  });

  it('fetchArticles 失败时置空并记录错误', async () => {
    rejectWithError('fetchArticles');
    const r = await useStore.getState().fetchArticles();
    expect(r).toEqual({ total: 0, page: 1, totalPages: 0 });
    expect(useStore.getState().loadingArticles).toBe(false);
    expect(useStore.getState().lastError).toBe('network down');
  });

  it('getArticleById 从列表查找', () => {
    useStore.setState({ articles: listResult.items as any });
    expect(useStore.getState().getArticleById('a1')?.title).toBe('A');
    expect(useStore.getState().getArticleById('nope')).toBeUndefined();
  });
});

describe('工具', () => {
  it('fetchTools 成功/失败', async () => {
    mockedApi.fetchTools.mockResolvedValueOnce([{ id: 't1' }] as any);
    await useStore.getState().fetchTools();
    expect(useStore.getState().tools).toEqual([{ id: 't1' }]);

    rejectWithError('fetchTools');
    await useStore.getState().fetchTools();
    expect(useStore.getState().lastError).toBe('network down');
  });

  it('addTool / updateTool / deleteTool 本地操作', () => {
    useStore.getState().addTool({ id: 't1', name: 'x' } as any);
    useStore.getState().addTool({ id: 't2', name: 'y' } as any);
    useStore.getState().updateTool('t1', { name: 'x2' });
    expect(useStore.getState().tools.find((t) => t.id === 't1')?.name).toBe('x2');
    useStore.getState().deleteTool('t1');
    expect(useStore.getState().tools.map((t) => t.id)).toEqual(['t2']);
  });
});

describe('照片', () => {
  it('fetchPhotos 成功/失败', async () => {
    mockedApi.fetchPhotos.mockResolvedValueOnce([{ id: 'p1' }] as any);
    await useStore.getState().fetchPhotos();
    expect(useStore.getState().photos).toEqual([{ id: 'p1' }]);

    rejectWithError('fetchPhotos');
    await useStore.getState().fetchPhotos();
    expect(useStore.getState().lastError).toBe('network down');
  });
});

describe('音乐日记', () => {
  it('fetchMusic 成功/失败', async () => {
    mockedApi.fetchMusic.mockResolvedValueOnce([{ id: 'm1' }] as any);
    await useStore.getState().fetchMusic();
    expect(useStore.getState().musicEntries).toEqual([{ id: 'm1' }]);

    rejectWithError('fetchMusic');
    await useStore.getState().fetchMusic();
    expect(useStore.getState().lastError).toBe('network down');
  });
});

describe('友链', () => {
  const link = { id: 'l1', name: '友', url: 'https://a.com', description: '', type: 'admin' as const, status: 'pending' as const, created_at: '2026-01-01' };

  it('fetchFriendLinks 成功/失败', async () => {
    mockedApi.fetchFriendLinks.mockResolvedValueOnce({ all: [link] } as any);
    await useStore.getState().fetchFriendLinks();
    expect(useStore.getState().friendLinks).toEqual([link]);

    rejectWithError('fetchFriendLinks');
    await useStore.getState().fetchFriendLinks();
    expect(useStore.getState().lastError).toBe('network down');
  });

  it('addFriendLink 成功时追加到列表', async () => {
    mockedApi.addFriendLink.mockResolvedValueOnce({ link } as any);
    await useStore.getState().addFriendLink({ name: '友', url: 'https://a.com', isAdmin: true });
    expect(useStore.getState().friendLinks).toEqual([link]);
  });

  it('addFriendLink 失败记录错误', async () => {
    rejectWithError('addFriendLink');
    await useStore.getState().addFriendLink({ name: '友', url: 'https://a.com', isAdmin: true });
    expect(useStore.getState().friendLinks).toEqual([]);
    expect(useStore.getState().lastError).toBe('network down');
  });

  it('approveFriendLink 更新匹配项状态', async () => {
    useStore.setState({ friendLinks: [{ ...link, status: 'pending' }] });
    mockedApi.approveFriendLink.mockResolvedValueOnce({ link } as any);
    await useStore.getState().approveFriendLink('l1');
    expect(useStore.getState().friendLinks[0].status).toBe('approved');
  });

  it('rejectFriendLink 更新匹配项状态', async () => {
    useStore.setState({ friendLinks: [{ ...link, status: 'pending' }] });
    mockedApi.rejectFriendLink.mockResolvedValueOnce({ link } as any);
    await useStore.getState().rejectFriendLink('l1');
    expect(useStore.getState().friendLinks[0].status).toBe('rejected');
  });

  it('deleteFriendLink 从列表移除', async () => {
    useStore.setState({ friendLinks: [{ ...link, status: 'approved' }] });
    mockedApi.deleteFriendLink.mockResolvedValueOnce({ success: true } as any);
    await useStore.getState().deleteFriendLink('l1');
    expect(useStore.getState().friendLinks).toEqual([]);
  });
});

describe('站点设置', () => {
  it('fetchSiteSettings 成功/失败', async () => {
    const settings = { siteTitle: '莫', siteDescription: '', siteFooter: '', siteKeywords: '', icp: '' };
    mockedApi.getSettings.mockResolvedValueOnce(settings as any);
    await useStore.getState().fetchSiteSettings();
    expect(useStore.getState().siteSettings).toEqual(settings);

    rejectWithError('getSettings');
    await useStore.getState().fetchSiteSettings();
    expect(useStore.getState().lastError).toBe('network down');
  });
});

describe('时间轴', () => {
  const item = { id: 'i1', title: 't' };

  it('fetchTimeline 成功/失败', async () => {
    mockedApi.fetchTimeline.mockResolvedValueOnce([item] as any);
    await useStore.getState().fetchTimeline();
    expect(useStore.getState().timelineEvents).toEqual([item]);

    rejectWithError('fetchTimeline');
    await useStore.getState().fetchTimeline();
    expect(useStore.getState().lastError).toBe('network down');
  });

  it('addTimelineEvent 成功后追加', async () => {
    mockedApi.createTimelineEvent.mockResolvedValueOnce({ item } as any);
    await useStore.getState().addTimelineEvent({ title: 't' });
    expect(useStore.getState().timelineEvents).toEqual([item]);
  });

  it('updateTimelineItem 更新匹配项', async () => {
    useStore.setState({ timelineEvents: [item as any] });
    mockedApi.updateTimelineEvent.mockResolvedValueOnce({ item: { ...item, title: 't2' } } as any);
    await useStore.getState().updateTimelineItem('i1', { title: 't2' });
    expect(useStore.getState().timelineEvents[0].title).toBe('t2');
  });

  it('removeTimelineEvent 移除匹配项', async () => {
    useStore.setState({ timelineEvents: [item as any] });
    mockedApi.deleteTimelineEvent.mockResolvedValueOnce({ success: true } as any);
    await useStore.getState().removeTimelineEvent('i1');
    expect(useStore.getState().timelineEvents).toEqual([]);
  });
});

describe('关于页', () => {
  it('fetchAbout 成功/失败', async () => {
    mockedApi.fetchAbout.mockResolvedValueOnce({ aboutContent: 'hi' } as any);
    await useStore.getState().fetchAbout();
    expect(useStore.getState().about).toEqual({ aboutContent: 'hi' });

    rejectWithError('fetchAbout');
    await useStore.getState().fetchAbout();
    expect(useStore.getState().lastError).toBe('network down');
  });

  it('updateAboutPage 成功后更新 about', async () => {
    mockedApi.updateAbout.mockResolvedValueOnce({ about: { aboutContent: 'hi2' } } as any);
    await useStore.getState().updateAboutPage({ aboutContent: 'hi2' });
    expect(useStore.getState().about).toEqual({ aboutContent: 'hi2' });
  });
});

describe('错误上报', () => {
  it('非 Error 异常使用兜底文案', async () => {
    rejectWithPlain('fetchTools');
    await useStore.getState().fetchTools();
    expect(useStore.getState().lastError).toBe('请求失败，请稍后重试');
  });
});
