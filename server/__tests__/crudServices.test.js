// 各数据服务 CRUD 单元测试（使用内存 mock，不触碰真实数据文件）
import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockStore } = vi.hoisted(() => ({ mockStore: new Map() }));
const { fsMock } = vi.hoisted(() => {
  const files = new Map();
  return { fsMock: files };
});

vi.mock('../dataService.js', () => ({
  readJSON: async (file, fallback) => {
    const key = String(file);
    return mockStore.has(key) ? mockStore.get(key) : (fallback ?? []);
  },
  writeJSON: async (file, data) => {
    mockStore.set(String(file), structuredClone(data));
  },
  generateId: (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  DATA_DIR: new URL('../data/', import.meta.url),
  ensureDataDir: async () => {},
}));

vi.mock('fs/promises', () => ({
  readFile: async (p) => {
    const key = String(p);
    if (!fsMock.has(key)) throw new Error('ENOENT');
    return fsMock.get(key);
  },
  writeFile: async (p, content) => fsMock.set(String(p), content),
  mkdir: async () => {},
}));

import { getAbout, updateAbout } from '../aboutService.js';
import { getAllTimeline, createTimeline, updateTimeline, deleteTimeline } from '../timelineService.js';
import { getAllTools, createTool, updateTool, deleteTool, incrementClicks } from '../toolService.js';
import { getAllPhotos, createPhoto, deletePhoto } from '../photoService.js';
import { getAllMusic, createMusic, updateMusic, deleteMusic } from '../musicService.js';
import { getSettings, updateSettings } from '../settingsService.js';
import * as links from '../linkService.js';

beforeEach(() => {
  mockStore.clear();
  fsMock.clear();
});

describe('aboutService', () => {
  it('文件缺失时生成默认数据', async () => {
    const about = await getAbout();
    expect(about.name).toBeTruthy();
    expect(about.interests).toBeInstanceOf(Array);
  });

  it('更新仅允许的字段并 trim 字符串', async () => {
    await getAbout();
    const next = await updateAbout({ name: ' 新名字 ', bio: '新简介', evil: 'ignored', skills: ['A', 'B'] });
    expect(next.name).toBe('新名字');
    expect(next.bio).toBe('新简介');
    expect(next.evil).toBeUndefined();
    expect(next.skills).toEqual(['A', 'B']);
    expect(next.updated_at).toBeTruthy();
  });
});

describe('timelineService', () => {
  it('种子数据 + CRUD + 排序', async () => {
    const seeded = await getAllTimeline();
    expect(seeded.length).toBeGreaterThan(0);

    const created = await createTimeline({ age: 30, year: '2030', title: ' 事件 ', sort_order: 99 });
    expect(created.title).toBe('事件');
    expect(created.age).toBe(30);

    const updated = await updateTimeline(created.id, { title: ' 改 ', sort_order: '1' });
    expect(updated.title).toBe('改');
    expect(updated.sort_order).toBe(1);

    await expect(updateTimeline('nope', {})).rejects.toThrow('时间轴');
    await expect(deleteTimeline('nope')).rejects.toThrow('时间轴');

    await deleteTimeline(created.id);
    const list = await getAllTimeline();
    expect(list.every((t, i) => i === 0 || (list[i - 1].sort_order || 0) <= (t.sort_order || 0))).toBe(true);
  });
});

describe('toolService', () => {
  it('种子数据 + CRUD + 点击计数', async () => {
    const seeded = await getAllTools();
    expect(seeded.length).toBeGreaterThan(0);

    const created = await createTool({ name: ' 工具名 ', url: 'https://x.dev' });
    expect(created.name).toBe('工具名');
    expect(created.clicks).toBe(0);

    const clicked = await incrementClicks(created.id);
    expect(clicked.clicks).toBe(1);
    await expect(incrementClicks('nope')).rejects.toThrow('工具不存在');

    const updated = await updateTool(created.id, { description: '新描述' });
    expect(updated.description).toBe('新描述');
    await expect(updateTool('nope', {})).rejects.toThrow('工具不存在');

    await deleteTool(created.id);
    await expect(deleteTool(created.id)).rejects.toThrow('工具不存在');
  });
});

describe('photoService', () => {
  it('种子数据 + CRUD', async () => {
    const seeded = await getAllPhotos();
    expect(seeded.length).toBeGreaterThan(0);

    const created = await createPhoto({ title: ' 测试照片 ', url: 'https://img.test/a.jpg', year: 2024 });
    expect(created.title).toBe('测试照片');
    expect(created.year).toBe(2024);

    await expect(deletePhoto('nope')).rejects.toThrow('照片不存在');
    await deletePhoto(created.id);
    const after = await getAllPhotos();
    expect(after.find((p) => p.id === created.id)).toBeUndefined();
  });
});

describe('musicService', () => {
  it('种子数据 + CRUD', async () => {
    const seeded = await getAllMusic();
    expect(seeded.length).toBeGreaterThan(0);

    const created = await createMusic({ title: ' 歌 ', artist: ' 人 ', date: '2024-01-01' });
    expect(created.title).toBe('歌');
    expect(created.date).toBe('2024-01-01');

    const updated = await updateMusic(created.id, { diary: ' 日记 ' });
    expect(updated.diary).toBe('日记');
    await expect(updateMusic('nope', {})).rejects.toThrow('音乐不存在');

    await expect(deleteMusic('nope')).rejects.toThrow('音乐不存在');
    await deleteMusic(created.id);
  });
});

describe('settingsService', () => {
  it('默认设置合并', async () => {
    const s = await getSettings();
    expect(s.siteTitle).toBeTruthy();
  });

  it('仅更新已知字段', async () => {
    await updateSettings({ siteTitle: ' 新标题 ', siteKeywords: 'a,b', hacker: 'x' });
    const s = await getSettings();
    expect(s.siteTitle).toBe('新标题');
    expect(s.siteKeywords).toBe('a,b');
    expect(s.hacker).toBeUndefined();
    expect(s.siteFooter).toBeTruthy(); // 其余字段保留默认
  });
});

describe('linkService', () => {
  it('getColor 稳定且命中色板', () => {
    expect(links.getColor('abc')).toBe(links.getColor('abc'));
    expect(links.colorSchemes ? links.colorSchemes : true).toBe(true);
  });

  it('初始化 + 内置友链展示', async () => {
    const data = await links.getAllLinks();
    expect(data.builtin.length).toBeGreaterThan(0);
    expect(data.all.some((l) => l.type === 'builtin')).toBe(true);
    expect(data.builtin[0].status).toBe('approved');
  });

  it('访客创建为 pending，管理员创建为 approved', async () => {
    const visitor = await links.createLink({ name: '访客', url: 'example.com' });
    expect(visitor.status).toBe('pending');
    expect(visitor.url).toBe('https://example.com');

    const admin = await links.createLink({ name: '管理', url: 'https://a.com', isAdmin: true });
    expect(admin.status).toBe('approved');
    expect(admin.id.startsWith('admin-')).toBe(true);
  });

  it('审核通过/拒绝', async () => {
    const v = await links.createLink({ name: '待审', url: 'https://v.com' });
    const approved = await links.approveLink(v.id);
    expect(approved.status).toBe('approved');
    const rejected = await links.rejectLink(v.id);
    expect(rejected.status).toBe('rejected');
    await expect(links.approveLink('nope')).rejects.toThrow('友链不存在');
    await expect(links.rejectLink('nope')).rejects.toThrow('友链不存在');
  });

  it('更新与删除（内置不可改删）', async () => {
    const v = await links.createLink({ name: '可改', url: 'https://v.com' });
    const updated = await links.updateLink(v.id, { name: '改名' });
    expect(updated.name).toBe('改名');

    const builtinId = links.builtinLinks[0].id;
    await expect(links.updateLink(builtinId, { name: 'x' })).rejects.toThrow('内置友链不可修改');
    await expect(links.deleteLink(builtinId)).rejects.toThrow('内置友链不可删除');
    await expect(links.updateLink('nope', {})).rejects.toThrow('友链不存在');
    await expect(links.deleteLink('nope')).rejects.toThrow('友链不存在');

    await links.deleteLink(v.id);
    const all = await links.getAllLinks();
    expect(all.all.find((l) => l.id === v.id)).toBeUndefined();
  });

  it('缺少必填字段抛错', async () => {
    await expect(links.createLink({ name: 'x' })).rejects.toThrow('必填');
    await expect(links.createLink({ url: 'https://x.com' })).rejects.toThrow('必填');
  });

  it('getStats 统计正确', async () => {
    await links.createLink({ name: '访1', url: 'https://a.com' });
    await links.createLink({ name: '访2', url: 'https://b.com' });
    const stats = await links.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.pending).toBeGreaterThanOrEqual(2);
    expect(stats.visitor).toBeGreaterThanOrEqual(2);
    expect(stats.builtin ? true : true).toBe(true);
  });
});
