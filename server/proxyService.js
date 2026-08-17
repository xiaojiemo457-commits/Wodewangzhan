// 资源代理服务（SSRF 防护）- 开发环境（vite）与生产环境（server/index.js）共用
// 安全策略：
//   1. 仅允许 http/https 协议
//   2. 解析目标域名，所有解析出的 IP 必须是公网地址（拦截内网/回环/链路本地/保留地址）
//   3. 手动跟随重定向（最多 3 跳），每跳重新校验目标地址
//   4. 请求超时 15 秒，防止悬挂

import { lookup } from 'dns/promises';
import { isIP } from 'net';

// IPv4 私网/回环/链路本地/保留段（含 CGNAT 100.64/10）
const BLOCKED_V4 = /^(0\.|10\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|224\.|240\.)/;
// IPv6 回环/链路本地/ULA/组播
const BLOCKED_V6 = /^(::1$|^::$|fc|fd|fe80|fe9|fea|feb|ff)/i;

const REQUEST_TIMEOUT = 15_000;
const MAX_REDIRECTS = 3;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** 判断 IP 是否为内网/危险地址 */
export function isBlockedIP(ip) {
  const version = isIP(ip);
  if (version === 4) return BLOCKED_V4.test(ip);
  if (version === 6) return BLOCKED_V6.test(ip);
  return true; // 无法识别的地址一律拦截
}

/** 解析域名，返回所有公网 IP；失败或全部为内网时返回空数组 */
export async function resolvePublicIPs(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host === 'localhost.localdomain') return [];
  try {
    const addrs = await lookup(host, { all: true, verbatim: true });
    return addrs.map(a => a.address).filter(ip => !isBlockedIP(ip));
  } catch {
    return [];
  }
}

/** 规范化并解析目标 URL；协议不合法时抛错 */
export function parseTarget(raw) {
  let fixed = String(raw ?? '').trim();
  // 修复用户误输入的双重协议
  fixed = fixed.replace(/^https?:\/\/https?:\/\//i, 'https://');
  if (fixed.startsWith('//')) fixed = 'https:' + fixed;
  const url = new URL(fixed); // 非法 URL 会抛 TypeError
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('仅支持 http/https 协议');
  }
  return url;
}

/** 断言目标主机解析出的 IP 全部为公网地址，否则抛错 */
export async function assertPublicTarget(url) {
  const ips = await resolvePublicIPs(url.hostname);
  if (ips.length === 0) throw new Error('目标地址不可达或属于内网地址');
}

/**
 * 安全抓取：校验目标 -> 带超时请求 -> 手动跟随重定向（每跳重新校验）
 * @returns {Promise<Response>}
 */
export async function safeFetch(raw, init = {}, redirectsLeft = MAX_REDIRECTS) {
  const url = parseTarget(raw);
  await assertPublicTarget(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(init.timeout) || REQUEST_TIMEOUT);
  let res;
  try {
    res = await fetch(url, { ...init, redirect: 'manual', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (location && redirectsLeft > 0) {
      const next = new URL(location, url); // 相对重定向基于当前 URL 解析
      await assertPublicTarget(next);
      return safeFetch(next.toString(), init, redirectsLeft - 1);
    }
    throw new Error('重定向次数过多或重定向目标非法');
  }
  return res;
}

/** 流式转发响应体到 res（含 Range 支持） */
async function streamResponse(req, res, response) {
  const ct = response.headers.get('content-type') || 'application/octet-stream';
  res.setHeader('Content-Type', ct);
  res.setHeader('Accept-Ranges', 'bytes');
  const contentRange = response.headers.get('content-range');
  if (contentRange) res.setHeader('Content-Range', contentRange);
  const contentLength = response.headers.get('content-length');
  if (contentLength) res.setHeader('Content-Length', contentLength);

  if (ct.includes('image')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else if (ct.includes('audio') || ct.includes('video')) res.setHeader('Cache-Control', 'public, max-age=3600');
  else res.setHeader('Cache-Control', 'no-store');

  res.statusCode = response.status;

  if (req?.method === 'HEAD') return res.end();
  if (!response.body) return res.end();

  const reader = response.body.getReader();
  let aborted = false;
  if (req) req.on('close', () => { aborted = true; reader.cancel().catch(() => {}); });
  try {
    while (!aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    if (!aborted) res.end();
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Stream error');
    }
  }
}

/**
 * Express 风格中间件：?url= 参数代理
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export async function proxyHandler(req, res) {
  const host = req.headers.host || 'localhost';
  const reqUrl = new URL(req.url, `http://${host}`);
  const target = reqUrl.searchParams.get('url');
  if (!target) {
    res.statusCode = 400;
    res.end('Missing url parameter');
    return;
  }

  try {
    const url = parseTarget(target);
    await assertPublicTarget(url);

    const headers = {
      'User-Agent': UA,
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Referer': url.origin + '/',
    };
    const range = req.headers.range;
    if (range) headers['Range'] = range;

    const response = await safeFetch(url, { headers, cache: 'no-store' });
    if (!response.ok && response.status !== 206) {
      res.statusCode = response.status;
      res.end('Upstream fetch failed');
      return;
    }
    await streamResponse(req, res, response);
  } catch (err) {
    const msg = err && err.message;
    const status = msg === '仅支持 http/https 协议' ? 403 : 502;
    if (!res.headersSent) {
      res.statusCode = status;
      res.end(msg === '仅支持 http/https 协议' ? 'Bad protocol' : 'Proxy failed');
    }
  }
}

export default { isBlockedIP, resolvePublicIPs, parseTarget, assertPublicTarget, safeFetch, proxyHandler };
