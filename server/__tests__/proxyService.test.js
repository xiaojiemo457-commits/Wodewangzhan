// proxyService 单元测试：SSRF 防护（内网拦截、DNS 校验、重定向校验、超时）
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('dns/promises', () => ({ lookup: vi.fn() }));
import { lookup } from 'dns/promises';
import { isBlockedIP, parseTarget, resolvePublicIPs, assertPublicTarget, safeFetch, proxyHandler } from '../proxyService.js';

const mockLookup = vi.mocked(lookup);

beforeEach(() => {
  mockLookup.mockReset();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isBlockedIP', () => {
  it.each([
    ['127.0.0.1', true], ['10.1.2.3', true], ['172.16.0.1', true], ['172.31.255.1', true],
    ['192.168.1.1', true], ['169.254.169.254', true], ['0.0.0.0', true], ['100.64.0.1', true],
    ['224.0.0.1', true], ['240.0.0.1', true],
    ['8.8.8.8', false], ['1.1.1.1', false], ['114.114.114.114', false],
  ])('IPv4 %s 拦截=%s', (ip, blocked) => {
    expect(isBlockedIP(ip)).toBe(blocked);
  });

  it.each([
    ['::1', true], ['::', true], ['fe80::1', true], ['fc00::1', true], ['fd12:3456::1', true], ['ff02::1', true],
    ['2001:4860:4860::8888', false], ['2400:3200::1', false],
  ])('IPv6 %s 拦截=%s', (ip, blocked) => {
    expect(isBlockedIP(ip)).toBe(blocked);
  });

  it('非 IP 一律拦截', () => {
    expect(isBlockedIP('not-an-ip')).toBe(true);
    expect(isBlockedIP('')).toBe(true);
  });
});

describe('parseTarget', () => {
  it('正常 URL', () => {
    expect(parseTarget('https://example.com/a?b=1').toString()).toBe('https://example.com/a?b=1');
  });

  it('修复双重协议前缀', () => {
    expect(parseTarget('https://https://example.com/x').host).toBe('example.com');
    expect(parseTarget('http://http://example.com/x').host).toBe('example.com');
  });

  it('协议相对 URL 补全 https', () => {
    expect(parseTarget('//example.com/x').protocol).toBe('https:');
  });

  it('非法协议抛错', () => {
    expect(() => parseTarget('ftp://example.com')).toThrow('http/https');
    expect(() => parseTarget('file:///etc/passwd')).toThrow('http/https');
  });

  it('非法 URL 抛错', () => {
    expect(() => parseTarget('not a url')).toThrow();
    expect(() => parseTarget('')).toThrow();
  });
});

describe('resolvePublicIPs / assertPublicTarget', () => {
  it('解析失败或全内网返回空数组', async () => {
    mockLookup.mockRejectedValue(new Error('ENOTFOUND'));
    expect(await resolvePublicIPs('nonexistent.test')).toEqual([]);

    mockLookup.mockResolvedValue([{ address: '127.0.0.1' }, { address: '10.0.0.5' }]);
    expect(await resolvePublicIPs('internal.test')).toEqual([]);
  });

  it('localhost 直接拦截', async () => {
    expect(await resolvePublicIPs('localhost')).toEqual([]);
    expect(await resolvePublicIPs('LOCALHOST.')).toEqual([]);
  });

  it('公网域名返回全部公网 IP，过滤掉内网 IP', async () => {
    mockLookup.mockResolvedValue([
      { address: '93.184.216.34' },
      { address: '192.168.1.2' }, // 混合时内网被过滤
    ]);
    expect(await resolvePublicIPs('example.com')).toEqual(['93.184.216.34']);
  });

  it('assertPublicTarget 对内网主机抛错', async () => {
    mockLookup.mockResolvedValue([{ address: '127.0.0.1' }]);
    await expect(assertPublicTarget(new URL('http://evil.local/x'))).rejects.toThrow('内网');
  });

  it('assertPublicTarget 通过公网主机', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    await expect(assertPublicTarget(new URL('https://example.com'))).resolves.toBeUndefined();
  });
});

describe('safeFetch', () => {
  it('成功抓取并返回响应', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    const resp = new Response('hello', { status: 200, headers: { 'content-type': 'text/plain' } });
    const fetchSpy = vi.fn().mockResolvedValue(resp);
    vi.stubGlobal('fetch', fetchSpy);

    const out = await safeFetch('https://example.com/');
    expect(out.status).toBe(200);
    expect(await out.text()).toBe('hello');
    expect(fetchSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ redirect: 'manual' }));
  });

  it('目标为内网时直接拒绝，不发起请求', async () => {
    mockLookup.mockResolvedValue([{ address: '10.0.0.1' }]);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await expect(safeFetch('http://internal/x')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('跟随重定向且每跳重新校验（重定向到内网被拒）', async () => {
    mockLookup
      .mockResolvedValueOnce([{ address: '8.8.8.8' }]) // example.com 公网
      .mockResolvedValueOnce([{ address: '127.0.0.1' }]); // 重定向目标内网
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secret' } })));
    await expect(safeFetch('https://example.com/')).rejects.toThrow('内网');
  });

  it('跟随合法重定向成功', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: 'https://example.com/final' } }))
      .mockResolvedValueOnce(new Response('done', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    const out = await safeFetch('https://example.com/start');
    expect(out.status).toBe(200);
    expect(await out.text()).toBe('done');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('重定向次数超限抛错', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://example.com/x' } })));
    await expect(safeFetch('https://example.com/')).rejects.toThrow('重定向');
  });

  it('请求超时中止', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('Aborted')));
    })));
    await expect(safeFetch('https://slow.example/', { timeout: 1 })).rejects.toThrow('Aborted');
  });
});

describe('proxyHandler（中间件）', () => {
  function mockRes() {
    const headers = {};
    return {
      headers,
      statusCode: 0,
      setHeader(k, v) { headers[k] = v; },
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      headersSent: false,
    };
  }

  it('缺少 url 参数返回 400', async () => {
    const res = mockRes();
    await proxyHandler({ url: '/res-proxy', headers: { host: 'localhost' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.end).toHaveBeenCalled();
  });

  it('非法协议返回 403', async () => {
    const res = mockRes();
    await proxyHandler({ url: '/res-proxy?url=ftp%3A%2F%2Fx', headers: { host: 'localhost' } }, res);
    expect(res.statusCode).toBe(403);
  });

  it('内网目标返回 502', async () => {
    mockLookup.mockResolvedValue([{ address: '169.254.169.254' }]);
    const res = mockRes();
    await proxyHandler({ url: '/img-proxy?url=http%3A%2F%2Fmetadata%2F', headers: { host: 'localhost' } }, res);
    expect(res.statusCode).toBe(502);
  });

  it('成功代理并流式返回内容', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('streamed-data', {
      status: 200,
      headers: { 'content-type': 'text/plain', 'content-length': '13' },
    })));
    const res = mockRes();
    const req = { url: '/res-proxy?url=https%3A%2F%2Fexample.com%2Fa', headers: { host: 'localhost' }, method: 'GET', on: vi.fn() };
    await proxyHandler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/plain');
    // 数据被写入响应
    const written = res.write.mock.calls.map((c) => c[0].toString()).join('');
    expect(written).toBe('streamed-data');
  });

  it('上游返回错误状态时透传状态码', async () => {
    mockLookup.mockResolvedValue([{ address: '8.8.8.8' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not found', { status: 404 })));
    const res = mockRes();
    await proxyHandler({ url: '/res-proxy?url=https%3A%2F%2Fexample.com%2F404', headers: { host: 'localhost' }, method: 'GET' }, res);
    expect(res.statusCode).toBe(404);
  });
});
