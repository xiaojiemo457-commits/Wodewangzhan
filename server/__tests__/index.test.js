// index.js 入口服务器测试：mock http / fs，验证静态服务、SPA 回退、代理与 API 分发
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fsState } = vi.hoisted(() => ({
  fsState: { files: new Map(), dirs: new Map() },
}));

const { httpMock } = vi.hoisted(() => ({
  httpMock: { handler: null, listen: vi.fn(), listenCalled: false },
}));

vi.mock('http', () => ({
  createServer: vi.fn((handler) => {
    httpMock.handler = handler;
    return {
      listen: vi.fn(() => {
        httpMock.listenCalled = true;
      }),
    };
  }),
}));

/** 最长后缀优先匹配，避免 'index.html' 误匹配 'admin\index.html' */
function findLongestSuffix(key, map) {
  let best = null;
  for (const k of map.keys()) {
    if ((key.endsWith('\\' + k) || key.endsWith('/' + k)) && (!best || k.length > best.length)) {
      best = k;
    }
  }
  return best;
}

vi.mock('fs/promises', () => ({
  readFile: vi.fn(async (p) => {
    const key = String(p);
    const hit = findLongestSuffix(key, fsState.files);
    if (hit) return fsState.files.get(hit);
    const e = new Error('ENOENT');
    e.code = 'ENOENT';
    throw e;
  }),
  stat: vi.fn(async (p) => {
    const key = String(p);
    if (findLongestSuffix(key, fsState.dirs)) return { isDirectory: () => true };
    if (findLongestSuffix(key, fsState.files)) return { isDirectory: () => false };
    const e = new Error('ENOENT');
    e.code = 'ENOENT';
    throw e;
  }),
}));

vi.mock('../apiMiddleware.js', () => ({
  handleApi: vi.fn(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true }));
  }),
}));

vi.mock('../proxyService.js', () => ({
  proxyHandler: vi.fn(async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('proxied');
  }),
}));

vi.mock('../linkService.js', () => ({
  LINKS_FILE: 'mock-links.json',
}));

import { server } from '../index.js';
import { handleApi } from '../apiMiddleware.js';
import { proxyHandler } from '../proxyService.js';
import { readFile } from 'fs/promises';

function makeReq(method, url) {
  return {
    method,
    url,
    headers: { host: 'localhost' },
  };
}

function makeRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(k, v) {
      this.headers[k] = v;
    },
    writeHead(code, h) {
      this.statusCode = code;
      this.headers = { ...this.headers, ...(h || {}) };
    },
    end(data) {
      this.body = data;
    },
  };
}

async function request(method, url) {
  const req = makeReq(method, url);
  const res = makeRes();
  await httpMock.handler(req, res);
  return res;
}

function setupDist(files = {}, dirs = []) {
  fsState.files.clear();
  fsState.dirs.clear();
  for (const [rel, content] of Object.entries(files)) {
    fsState.files.set(rel.split('/').join('\\'), Buffer.from(content));
  }
  for (const d of dirs) fsState.dirs.set(d.split('/').join('\\'), true);
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDist({ 'index.html': '<div id="app"></div>' });
});

describe('服务器创建', () => {
  it('导出 server 并监听端口', () => {
    expect(server).toBeTruthy();
    expect(httpMock.listenCalled).toBe(true);
  });
});

describe('通用处理', () => {
  it('OPTIONS 预检返回 204', async () => {
    const res = await request('OPTIONS', '/api/anything');
    expect(res.statusCode).toBe(204);
    expect(res.headers['X-Frame-Options']).toBe('DENY');
  });

  it('GET /res-proxy 交由代理处理', async () => {
    const res = await request('GET', '/res-proxy?url=https://example.com/a.png');
    expect(proxyHandler).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('proxied');
  });

  it('HEAD /img-proxy 也交由代理处理', async () => {
    const res = await request('HEAD', '/img-proxy?url=https://example.com/b.png');
    expect(proxyHandler).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('POST /res-proxy 不走代理，按静态文件处理', async () => {
    const res = await request('POST', '/res-proxy');
    expect(proxyHandler).not.toHaveBeenCalled();
    // SPA 回退到 index.html
    expect(res.statusCode).toBe(200);
    expect(res.body.toString()).toContain('app');
  });

  it('API 路由交由 handleApi 处理', async () => {
    const res = await request('GET', '/api/settings');
    expect(handleApi).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });

  it('handleApi 抛错时返回 500 JSON', async () => {
    handleApi.mockRejectedValueOnce(new Error('crash'));
    const res = await request('GET', '/api/boom');
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe('Internal server error');
  });
});

describe('静态文件服务', () => {
  it('返回已知文件的正确 MIME 类型', async () => {
    setupDist({
      'index.html': '<div id="app"></div>',
      'assets/app.js': 'console.log(1)',
      'styles.css': 'body{}',
      'pic.png': '\u0089PNG',
    });
    let res = await request('GET', '/index.html');
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/html');

    res = await request('GET', '/assets/app.js');
    expect(res.headers['Content-Type']).toContain('application/javascript');

    res = await request('GET', '/styles.css');
    expect(res.headers['Content-Type']).toContain('text/css');

    res = await request('GET', '/pic.png');
    expect(res.headers['Content-Type']).toContain('image/png');
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('未知扩展名使用 octet-stream', async () => {
    setupDist({ 'file.xyz': 'data' });
    const res = await request('GET', '/file.xyz');
    expect(res.headers['Content-Type']).toBe('application/octet-stream');
  });

  it('不存在的文件回退到 SPA index.html', async () => {
    setupDist({ 'index.html': '<div id="app"></div>' });
    const res = await request('GET', '/some/unknown/route');
    expect(res.statusCode).toBe(200);
    expect(res.body.toString()).toContain('app');
    expect(res.headers['Content-Type']).toContain('text/html');
  });

  it('目录路径返回该目录下的 index.html', async () => {
    setupDist(
      { 'index.html': '<div id="app"></div>', 'admin/index.html': '<div id="admin"></div>' },
      ['admin'],
    );
    const res = await request('GET', '/admin');
    expect(res.statusCode).toBe(200);
    expect(res.body.toString()).toContain('admin');
  });

  it('目录下无 index.html 时回退到根 index.html', async () => {
    setupDist({ 'index.html': '<div id="app"></div>' }, ['empty']);
    const res = await request('GET', '/empty');
    expect(res.statusCode).toBe(200);
    expect(res.body.toString()).toContain('app');
  });

  it('目录穿越路径被限制在 dist 内', async () => {
    setupDist({ 'index.html': '<div id="app"></div>' });
    const res = await request('GET', '/..%2F..%2F..%2Fwindows/win.ini');
    expect(res.statusCode).toBe(200);
    expect(res.body.toString()).toContain('app');
  });

  it('dist/index.html 也不存在时返回 404', async () => {
    setupDist({});
    const res = await request('GET', '/anything');
    expect(res.statusCode).toBe(404);
    expect(res.body).toBe('Not Found');
  });

  it('静态文件读取失败时回退到 SPA', async () => {
    // stat 成功（文件存在）但 readFile 抛非 ENOENT 错误（如 EACCES）
    setupDist({ 'index.html': '<div id="app"></div>', 'styles.css': 'body{}' });
    vi.mocked(readFile).mockRejectedValueOnce(new Error('EACCES'));
    const res = await request('GET', '/styles.css');
    expect(res.statusCode).toBe(200);
    expect(res.body.toString()).toContain('app');
  });
});
