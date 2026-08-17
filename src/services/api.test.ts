// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  login,
  fetchAuthMe,
  logout,
  getSettings,
  updateSettings,
  fetchArticles,
  fetchArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  fetchTools,
  createTool,
  updateTool,
  deleteTool,
  fetchPhotos,
  createPhoto,
  deletePhoto,
  fetchMusic,
  createMusic,
  updateMusic,
  deleteMusic,
  fetchFriendLinks,
  addFriendLink,
  approveFriendLink,
  rejectFriendLink,
  deleteFriendLink,
  changePassword,
  fetchTimeline,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  fetchAbout,
  updateAbout,
  api,
} from './api';

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('request 基础行为', () => {
  it('未登录时请求不带 Authorization 头', async () => {
    const fn = mockFetch(200, { ok: true });
    await getSettings();
    const [, init] = fn.mock.calls[0];
    expect(fn).toHaveBeenCalledWith('/api/settings', expect.any(Object));
    expect(init.headers.Authorization).toBeUndefined();
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('已登录时请求自动携带 Bearer token', async () => {
    localStorage.setItem('admin_token', 'tok-123');
    const fn = mockFetch(200, { ok: true });
    await getSettings();
    const [, init] = fn.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok-123');
  });

  it('非 2xx 响应抛出包含状态码的错误', async () => {
    mockFetch(500, { error: 'boom' });
    await expect(getSettings()).rejects.toThrow('API error: 500');
  });
});

describe('认证', () => {
  it('login 提交密码', async () => {
    const fn = mockFetch(200, { token: 't' });
    await login('secret');
    expect(fn).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ password: 'secret' });
  });

  it('fetchAuthMe 请求当前登录态', async () => {
    const fn = mockFetch(200, { authenticated: true });
    await expect(fetchAuthMe()).resolves.toEqual({ authenticated: true });
    expect(fn.mock.calls[0][0]).toBe('/api/auth/me');
  });

  it('logout 发起 POST 请求', async () => {
    const fn = mockFetch(200, { success: true });
    await logout();
    expect(fn.mock.calls[0][0]).toBe('/api/auth/logout');
    expect(fn.mock.calls[0][1].method).toBe('POST');
  });
});

describe('站点设置', () => {
  it('getSettings 返回设置', async () => {
    const s = { siteTitle: '莫', siteDescription: '', siteFooter: '', siteKeywords: '', icp: '' };
    mockFetch(200, s);
    await expect(getSettings()).resolves.toEqual(s);
  });

  it('updateSettings 提交 PUT', async () => {
    const fn = mockFetch(200, { success: true, settings: { siteTitle: '新' } });
    await updateSettings({ siteTitle: '新' });
    expect(fn).toHaveBeenCalledWith('/api/settings', expect.objectContaining({ method: 'PUT' }));
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ siteTitle: '新' });
  });
});

describe('文章', () => {
  it('fetchArticles 无参数时不带 query', async () => {
    const fn = mockFetch(200, { items: [], total: 0, page: 1, totalPages: 0 });
    await fetchArticles();
    expect(fn.mock.calls[0][0]).toBe('/api/articles');
  });

  it('fetchArticles 带全部参数时拼接 query', async () => {
    const fn = mockFetch(200, { items: [], total: 0, page: 2, totalPages: 3 });
    await fetchArticles({ category: 'tech', search: 'react', page: 2 });
    expect(fn.mock.calls[0][0]).toBe('/api/articles?category=tech&search=react&page=2');
  });

  it('fetchArticleById 请求详情', async () => {
    const fn = mockFetch(200, { article: { id: 'a1' } });
    await expect(fetchArticleById('a1')).resolves.toEqual({ article: { id: 'a1' } });
    expect(fn.mock.calls[0][0]).toBe('/api/articles/a1');
  });

  it('createArticle / updateArticle / deleteArticle 使用正确方法与路径', async () => {
    let fn = mockFetch(201, { article: { id: 'n' } });
    await createArticle({ title: 't' });
    expect(fn.mock.calls[0][0]).toBe('/api/articles');
    expect(fn.mock.calls[0][1].method).toBe('POST');

    fn = mockFetch(200, { article: { id: 'a1' } });
    await updateArticle('a1', { title: 't2' });
    expect(fn.mock.calls[0][0]).toBe('/api/articles/a1');
    expect(fn.mock.calls[0][1].method).toBe('PUT');

    fn = mockFetch(200, { success: true });
    await deleteArticle('a1');
    expect(fn.mock.calls[0][0]).toBe('/api/articles/a1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('工具', () => {
  it('fetchTools 返回列表', async () => {
    mockFetch(200, []);
    await expect(fetchTools()).resolves.toEqual([]);
  });

  it('createTool / updateTool / deleteTool', async () => {
    let fn = mockFetch(201, { tool: { id: 't1' } });
    await createTool({ name: 'x' });
    expect(fn.mock.calls[0][0]).toBe('/api/tools');
    expect(fn.mock.calls[0][1].method).toBe('POST');

    fn = mockFetch(200, { tool: { id: 't1' } });
    await updateTool('t1', { name: 'y' });
    expect(fn.mock.calls[0][0]).toBe('/api/tools/t1');
    expect(fn.mock.calls[0][1].method).toBe('PUT');

    fn = mockFetch(200, { success: true });
    await deleteTool('t1');
    expect(fn.mock.calls[0][0]).toBe('/api/tools/t1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('照片', () => {
  it('fetchPhotos / createPhoto / deletePhoto', async () => {
    let fn = mockFetch(200, []);
    await fetchPhotos();
    expect(fn.mock.calls[0][0]).toBe('/api/photos');

    fn = mockFetch(201, { photo: { id: 'p1' } });
    await createPhoto({ url: 'u' });
    expect(fn.mock.calls[0][0]).toBe('/api/photos');
    expect(fn.mock.calls[0][1].method).toBe('POST');

    fn = mockFetch(200, { success: true });
    await deletePhoto('p1');
    expect(fn.mock.calls[0][0]).toBe('/api/photos/p1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('音乐日记', () => {
  it('fetchMusic / createMusic / updateMusic / deleteMusic', async () => {
    let fn = mockFetch(200, []);
    await fetchMusic();
    expect(fn.mock.calls[0][0]).toBe('/api/music');

    fn = mockFetch(201, { entry: { id: 'm1' } });
    await createMusic({ title: 'song' });
    expect(fn.mock.calls[0][0]).toBe('/api/music');
    expect(fn.mock.calls[0][1].method).toBe('POST');

    fn = mockFetch(200, { entry: { id: 'm1' } });
    await updateMusic('m1', { title: 'song2' });
    expect(fn.mock.calls[0][0]).toBe('/api/music/m1');
    expect(fn.mock.calls[0][1].method).toBe('PUT');

    fn = mockFetch(200, { success: true });
    await deleteMusic('m1');
    expect(fn.mock.calls[0][0]).toBe('/api/music/m1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('友链', () => {
  it('fetchFriendLinks 返回 all 列表', async () => {
    const fn = mockFetch(200, { all: [{ id: 'l1' }] });
    await expect(fetchFriendLinks()).resolves.toEqual({ all: [{ id: 'l1' }] });
    expect(fn.mock.calls[0][0]).toBe('/api/links');
  });

  it('addFriendLink 提交 POST', async () => {
    const fn = mockFetch(201, { link: { id: 'l1' } });
    await addFriendLink({ name: '友', url: 'https://a.com', isAdmin: true });
    expect(fn.mock.calls[0][0]).toBe('/api/links');
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ name: '友', url: 'https://a.com', isAdmin: true });
  });

  it('approveFriendLink / rejectFriendLink / deleteFriendLink', async () => {
    let fn = mockFetch(200, { link: { id: 'l1', status: 'approved' } });
    await approveFriendLink('l1');
    expect(fn.mock.calls[0][0]).toBe('/api/links/l1/approve');

    fn = mockFetch(200, { link: { id: 'l1', status: 'rejected' } });
    await rejectFriendLink('l1');
    expect(fn.mock.calls[0][0]).toBe('/api/links/l1/reject');

    fn = mockFetch(200, { success: true });
    await deleteFriendLink('l1');
    expect(fn.mock.calls[0][0]).toBe('/api/links/l1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('修改密码', () => {
  it('changePassword 提交新旧密码', async () => {
    const fn = mockFetch(200, { success: true });
    await changePassword('old', 'new');
    expect(fn.mock.calls[0][0]).toBe('/api/auth/password');
    expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({ currentPassword: 'old', newPassword: 'new' });
  });
});

describe('时间轴', () => {
  it('fetchTimeline / createTimelineEvent / updateTimelineEvent / deleteTimelineEvent', async () => {
    let fn = mockFetch(200, []);
    await fetchTimeline();
    expect(fn.mock.calls[0][0]).toBe('/api/timeline');

    fn = mockFetch(201, { item: { id: 'i1' } });
    await createTimelineEvent({ title: 't' });
    expect(fn.mock.calls[0][0]).toBe('/api/timeline');
    expect(fn.mock.calls[0][1].method).toBe('POST');

    fn = mockFetch(200, { item: { id: 'i1' } });
    await updateTimelineEvent('i1', { title: 't2' });
    expect(fn.mock.calls[0][0]).toBe('/api/timeline/i1');
    expect(fn.mock.calls[0][1].method).toBe('PUT');

    fn = mockFetch(200, { success: true });
    await deleteTimelineEvent('i1');
    expect(fn.mock.calls[0][0]).toBe('/api/timeline/i1');
    expect(fn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('关于页', () => {
  it('fetchAbout / updateAbout', async () => {
    let fn = mockFetch(200, { aboutContent: 'hi' });
    await expect(fetchAbout()).resolves.toEqual({ aboutContent: 'hi' });
    expect(fn.mock.calls[0][0]).toBe('/api/about');

    fn = mockFetch(200, { about: { aboutContent: 'hi2' } });
    await updateAbout({ aboutContent: 'hi2' });
    expect(fn.mock.calls[0][0]).toBe('/api/about');
    expect(fn.mock.calls[0][1].method).toBe('PUT');
  });
});

describe('api 聚合导出', () => {
  it('暴露全部方法', () => {
    expect(api.login).toBe(login);
    expect(api.getSettings).toBe(getSettings);
    expect(api.updateSettings).toBe(updateSettings);
    expect(api.fetchAuthMe).toBe(fetchAuthMe);
    expect(api.logout).toBe(logout);
  });
});
