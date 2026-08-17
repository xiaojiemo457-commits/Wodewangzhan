// apiMiddleware 路由分发单元测试：mock 全部 service 依赖，验证 URL/方法/鉴权/错误处理
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../articleService.js', () => ({
  getArticles: vi.fn(),
  getArticleById: vi.fn(),
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  deleteArticle: vi.fn(),
}));
vi.mock('../toolService.js', () => ({
  getAllTools: vi.fn(),
  createTool: vi.fn(),
  updateTool: vi.fn(),
  deleteTool: vi.fn(),
  incrementClicks: vi.fn(),
}));
vi.mock('../photoService.js', () => ({
  getAllPhotos: vi.fn(),
  createPhoto: vi.fn(),
  deletePhoto: vi.fn(),
}));
vi.mock('../musicService.js', () => ({
  getAllMusic: vi.fn(),
  createMusic: vi.fn(),
  deleteMusic: vi.fn(),
}));
vi.mock('../linkService.js', () => ({
  getAllLinks: vi.fn(),
  createLink: vi.fn(),
  updateLink: vi.fn(),
  deleteLink: vi.fn(),
  approveLink: vi.fn(),
  rejectLink: vi.fn(),
}));
vi.mock('../authService.js', () => ({
  login: vi.fn(),
  verify: vi.fn(),
  logout: vi.fn(),
  changePassword: vi.fn(),
}));
vi.mock('../settingsService.js', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));
vi.mock('../timelineService.js', () => ({
  getAllTimeline: vi.fn(),
  createTimeline: vi.fn(),
  updateTimeline: vi.fn(),
  deleteTimeline: vi.fn(),
}));
vi.mock('../aboutService.js', () => ({
  getAbout: vi.fn(),
  updateAbout: vi.fn(),
}));

import { handleApi } from '../apiMiddleware.js';
import * as articles from '../articleService.js';
import * as tools from '../toolService.js';
import * as photos from '../photoService.js';
import * as music from '../musicService.js';
import * as links from '../linkService.js';
import * as auth from '../authService.js';
import * as settings from '../settingsService.js';
import * as timeline from '../timelineService.js';
import * as about from '../aboutService.js';

/** 构造请求对象：body 通过 data 事件模拟 */
function makeReq(method, url, { body = '', headers = {} } = {}) {
  const req = {
    method,
    url,
    headers: { host: 'localhost', ...headers },
    socket: { remoteAddress: '127.0.0.1' },
    destroy: vi.fn(),
  };
  req.on = (evt, cb) => {
    if (evt === 'data' && body) cb(Buffer.from(body));
    if (evt === 'end') cb();
    return req;
  };
  return req;
}

/** 捕获响应输出 */
function makeRes() {
  return {
    statusCode: 0,
    statusMessage: '',
    headers: {},
    body: '',
    writeHead(code, h) {
      this.statusCode = code;
      this.headers = h || {};
    },
    end(data) {
      this.body = data;
    },
  };
}

/** 发起请求并返回 { status, json } */
async function call(method, url, opts = {}) {
  const req = makeReq(method, url, opts);
  const res = makeRes();
  await handleApi(req, res);
  return { status: res.statusCode, json: res.body ? JSON.parse(res.body) : null };
}

const asAdmin = { headers: { authorization: 'Bearer valid-token' } };

beforeEach(() => {
  vi.clearAllMocks();
  auth.verify.mockImplementation((t) => t === 'valid-token');
  // 默认让各 service 返回空数据，避免意外抛错
  articles.getArticles.mockResolvedValue({ items: [], total: 0, page: 1, totalPages: 0 });
  articles.getArticleById.mockResolvedValue(null);
  articles.createArticle.mockResolvedValue({ id: 'a1' });
  articles.updateArticle.mockResolvedValue({ id: 'a1' });
  articles.deleteArticle.mockResolvedValue({});
  tools.getAllTools.mockResolvedValue([]);
  tools.createTool.mockResolvedValue({ id: 't1' });
  tools.updateTool.mockResolvedValue({ id: 't1' });
  tools.deleteTool.mockResolvedValue({});
  tools.incrementClicks.mockResolvedValue({ id: 't1', clicks: 1 });
  photos.getAllPhotos.mockResolvedValue([]);
  photos.createPhoto.mockResolvedValue({ id: 'p1' });
  photos.deletePhoto.mockResolvedValue({});
  music.getAllMusic.mockResolvedValue([]);
  music.createMusic.mockResolvedValue({ id: 'm1' });
  music.deleteMusic.mockResolvedValue({});
  links.getAllLinks.mockResolvedValue({ all: [] });
  links.createLink.mockResolvedValue({ id: 'l1' });
  links.updateLink.mockResolvedValue({ id: 'l1' });
  links.deleteLink.mockResolvedValue({});
  links.approveLink.mockResolvedValue({ id: 'l1', status: 'approved' });
  links.rejectLink.mockResolvedValue({ id: 'l1', status: 'rejected' });
  auth.login.mockResolvedValue({ ok: true, token: 'tok' });
  auth.changePassword.mockResolvedValue({ ok: true });
  auth.logout.mockResolvedValue({});
  settings.getSettings.mockResolvedValue({ siteTitle: '莫' });
  settings.updateSettings.mockResolvedValue({ siteTitle: '新' });
  timeline.getAllTimeline.mockResolvedValue([]);
  timeline.createTimeline.mockResolvedValue({ id: 'i1' });
  timeline.updateTimeline.mockResolvedValue({ id: 'i1' });
  timeline.deleteTimeline.mockResolvedValue({});
  about.getAbout.mockResolvedValue({ aboutContent: 'hi' });
  about.updateAbout.mockResolvedValue({ aboutContent: 'hi2' });
});

describe('预检与通用行为', () => {
  it('OPTIONS 返回 200', async () => {
    const { status, json } = await call('OPTIONS', '/api/anything');
    expect(status).toBe(200);
    expect(json).toEqual({});
  });

  it('未匹配路由返回 404', async () => {
    const { status, json } = await call('GET', '/api/nope');
    expect(status).toBe(404);
    expect(json.error).toBe('API not found');
  });

  it('service 抛错时按文案映射 400/500', async () => {
    articles.createArticle.mockRejectedValue(new Error('文章标题必填'));
    let r = await call('POST', '/api/articles', { body: '{}', ...asAdmin });
    expect(r.status).toBe(400);

    articles.createArticle.mockRejectedValue(new Error('数据库炸了'));
    r = await call('POST', '/api/articles', { body: '{}', ...asAdmin });
    expect(r.status).toBe(500);
    expect(r.json.error).toBe('数据库炸了');
  });
});

describe('认证路由', () => {
  it('login 成功返回 token', async () => {
    const { status, json } = await call('POST', '/api/auth/login', { body: '{"password":"admin123"}' });
    expect(status).toBe(200);
    expect(json.token).toBe('tok');
    expect(auth.login).toHaveBeenCalledWith('admin123', '127.0.0.1');
  });

  it('login 失败未锁定时 401', async () => {
    auth.login.mockResolvedValue({ ok: false, locked: false, reason: '密码错误' });
    const { status, json } = await call('POST', '/api/auth/login', { body: '{"password":"x"}' });
    expect(status).toBe(401);
    expect(json.error).toBe('密码错误');
  });

  it('login 失败锁定时 429', async () => {
    auth.login.mockResolvedValue({ ok: false, locked: true, reason: '尝试过多' });
    const { status } = await call('POST', '/api/auth/login', { body: '{"password":"x"}' });
    expect(status).toBe(429);
  });

  it('me 未登录 401 / 已登录 200', async () => {
    let r = await call('GET', '/api/auth/me');
    expect(r.status).toBe(401);

    r = await call('GET', '/api/auth/me', asAdmin);
    expect(r.status).toBe(200);
    expect(r.json.authenticated).toBe(true);
  });

  it('logout 返回成功', async () => {
    const { status, json } = await call('POST', '/api/auth/logout');
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(auth.logout).toHaveBeenCalled();
  });

  it('password 未登录 401 / 成功 200 / 失败 400', async () => {
    let r = await call('POST', '/api/auth/password', { body: '{}' });
    expect(r.status).toBe(401);

    auth.changePassword.mockResolvedValue({ ok: true });
    r = await call('POST', '/api/auth/password', { body: '{"oldPassword":"a","newPassword":"b"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(auth.changePassword).toHaveBeenCalledWith('a', 'b');

    auth.changePassword.mockResolvedValue({ ok: false, reason: '旧密码错误' });
    r = await call('POST', '/api/auth/password', { body: '{"oldPassword":"a","newPassword":"b"}', ...asAdmin });
    expect(r.status).toBe(400);
  });
});

describe('设置路由', () => {
  it('GET /api/settings 公开返回', async () => {
    const { status, json } = await call('GET', '/api/settings');
    expect(status).toBe(200);
    expect(json.siteTitle).toBe('莫');
  });

  it('PUT /api/settings 需登录', async () => {
    let r = await call('PUT', '/api/settings', { body: '{}' });
    expect(r.status).toBe(401);

    r = await call('PUT', '/api/settings', { body: '{"siteTitle":"新"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(settings.updateSettings).toHaveBeenCalledWith({ siteTitle: '新' });
  });
});

describe('文章路由', () => {
  it('GET 列表透传 query 参数', async () => {
    const { status } = await call('GET', '/api/articles?category=tech&search=react&page=2&pageSize=10');
    expect(status).toBe(200);
    expect(articles.getArticles).toHaveBeenCalledWith({ category: 'tech', search: 'react', page: 2, pageSize: 10 });
  });

  it('GET 无 query 时使用默认分页', async () => {
    await call('GET', '/api/articles');
    expect(articles.getArticles).toHaveBeenCalledWith({ category: undefined, search: undefined, page: 1, pageSize: 24 });
  });

  it('POST 创建需登录', async () => {
    let r = await call('POST', '/api/articles', { body: '{}' });
    expect(r.status).toBe(401);

    r = await call('POST', '/api/articles', { body: '{"title":"t"}', ...asAdmin });
    expect(r.status).toBe(201);
    expect(articles.createArticle).toHaveBeenCalledWith({ title: 't' });
  });

  it('GET 单篇存在 200 / 不存在 404', async () => {
    articles.getArticleById.mockResolvedValue({ id: 'a1' });
    let r = await call('GET', '/api/articles/a1');
    expect(r.status).toBe(200);
    expect(r.json.article.id).toBe('a1');

    articles.getArticleById.mockResolvedValue(null);
    r = await call('GET', '/api/articles/a1');
    expect(r.status).toBe(404);
  });

  it('PUT / DELETE 需登录且调用对应 service', async () => {
    let r = await call('PUT', '/api/articles/a1', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('DELETE', '/api/articles/a1');
    expect(r.status).toBe(401);

    r = await call('PUT', '/api/articles/a1', { body: '{"title":"t2"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(articles.updateArticle).toHaveBeenCalledWith('a1', { title: 't2' });

    r = await call('DELETE', '/api/articles/a1', asAdmin);
    expect(r.status).toBe(200);
    expect(articles.deleteArticle).toHaveBeenCalledWith('a1');
  });
});

describe('工具路由', () => {
  it('GET 列表公开', async () => {
    const { status, json } = await call('GET', '/api/tools');
    expect(status).toBe(200);
    expect(json).toEqual([]);
  });

  it('POST 创建需登录', async () => {
    let r = await call('POST', '/api/tools', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('POST', '/api/tools', { body: '{"name":"x"}', ...asAdmin });
    expect(r.status).toBe(201);
    expect(tools.createTool).toHaveBeenCalledWith({ name: 'x' });
  });

  it('POST /click 公开且返回新点击数', async () => {
    const { status, json } = await call('POST', '/api/tools/t1/click');
    expect(status).toBe(200);
    expect(json.clicks).toBe(1);
    expect(tools.incrementClicks).toHaveBeenCalledWith('t1');
  });

  it('PUT / DELETE 需登录', async () => {
    let r = await call('PUT', '/api/tools/t1', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('PUT', '/api/tools/t1', { body: '{"name":"y"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(tools.updateTool).toHaveBeenCalledWith('t1', { name: 'y' });

    r = await call('DELETE', '/api/tools/t1', asAdmin);
    expect(r.status).toBe(200);
    expect(tools.deleteTool).toHaveBeenCalledWith('t1');
  });
});

describe('照片路由', () => {
  it('GET 公开 / POST 需登录 / DELETE 需登录', async () => {
    let r = await call('GET', '/api/photos');
    expect(r.status).toBe(200);

    r = await call('POST', '/api/photos', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('POST', '/api/photos', { body: '{"url":"u"}', ...asAdmin });
    expect(r.status).toBe(201);
    expect(photos.createPhoto).toHaveBeenCalledWith({ url: 'u' });

    r = await call('DELETE', '/api/photos/p1', asAdmin);
    expect(r.status).toBe(200);
    expect(photos.deletePhoto).toHaveBeenCalledWith('p1');
  });
});

describe('音乐路由', () => {
  it('GET 公开 / POST 需登录 / DELETE 需登录', async () => {
    let r = await call('GET', '/api/music');
    expect(r.status).toBe(200);

    r = await call('POST', '/api/music', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('POST', '/api/music', { body: '{"title":"s"}', ...asAdmin });
    expect(r.status).toBe(201);
    expect(music.createMusic).toHaveBeenCalledWith({ title: 's' });

    r = await call('DELETE', '/api/music/m1', asAdmin);
    expect(r.status).toBe(200);
    expect(music.deleteMusic).toHaveBeenCalledWith('m1');
  });
});

describe('友链路由', () => {
  it('GET 公开 / POST 公开添加', async () => {
    let r = await call('GET', '/api/links');
    expect(r.status).toBe(200);
    expect(r.json.all).toEqual([]);

    r = await call('POST', '/api/links', { body: '{"name":"友"}' });
    expect(r.status).toBe(201);
    expect(links.createLink).toHaveBeenCalledWith({ name: '友' });
  });

  it('approve / reject 需登录', async () => {
    let r = await call('POST', '/api/links/l1/approve');
    expect(r.status).toBe(401);
    r = await call('POST', '/api/links/l1/approve', asAdmin);
    expect(r.status).toBe(200);
    expect(links.approveLink).toHaveBeenCalledWith('l1');

    r = await call('POST', '/api/links/l1/reject', asAdmin);
    expect(r.status).toBe(200);
    expect(links.rejectLink).toHaveBeenCalledWith('l1');
  });

  it('PUT / DELETE 需登录', async () => {
    let r = await call('PUT', '/api/links/l1', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('DELETE', '/api/links/l1');
    expect(r.status).toBe(401);

    r = await call('PUT', '/api/links/l1', { body: '{"name":"友2"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(links.updateLink).toHaveBeenCalledWith('l1', { name: '友2' });

    r = await call('DELETE', '/api/links/l1', asAdmin);
    expect(r.status).toBe(200);
    expect(links.deleteLink).toHaveBeenCalledWith('l1');
  });
});

describe('时间轴路由', () => {
  it('GET 公开 / POST 需登录 / PUT、DELETE 需登录', async () => {
    let r = await call('GET', '/api/timeline');
    expect(r.status).toBe(200);

    r = await call('POST', '/api/timeline', { body: '{}' });
    expect(r.status).toBe(401);
    r = await call('POST', '/api/timeline', { body: '{"title":"t"}', ...asAdmin });
    expect(r.status).toBe(201);
    expect(timeline.createTimeline).toHaveBeenCalledWith({ title: 't' });

    r = await call('PUT', '/api/timeline/i1', { body: '{"title":"t2"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(timeline.updateTimeline).toHaveBeenCalledWith('i1', { title: 't2' });

    r = await call('DELETE', '/api/timeline/i1', asAdmin);
    expect(r.status).toBe(200);
    expect(timeline.deleteTimeline).toHaveBeenCalledWith('i1');
  });
});

describe('关于页路由', () => {
  it('GET 公开 / PUT 需登录', async () => {
    let r = await call('GET', '/api/about');
    expect(r.status).toBe(200);
    expect(r.json.aboutContent).toBe('hi');

    r = await call('PUT', '/api/about', { body: '{}' });
    expect(r.status).toBe(401);

    r = await call('PUT', '/api/about', { body: '{"aboutContent":"hi2"}', ...asAdmin });
    expect(r.status).toBe(200);
    expect(about.updateAbout).toHaveBeenCalledWith({ aboutContent: 'hi2' });
  });
});

describe('body 解析', () => {
  it('空 body 解析为空对象', async () => {
    await call('POST', '/api/tools', { body: '', ...asAdmin });
    expect(tools.createTool).toHaveBeenCalledWith({});
  });

  it('非法 JSON 解析为空对象而非报错', async () => {
    await call('POST', '/api/tools', { body: '{broken json', ...asAdmin });
    expect(tools.createTool).toHaveBeenCalledWith({});
  });

  it('超过 512KB 的 body 触发 500', async () => {
    const big = JSON.stringify({ data: 'x'.repeat(512 * 1024) });
    const { status } = await call('POST', '/api/tools', { body: big, ...asAdmin });
    expect(status).toBe(500);
  });
});
