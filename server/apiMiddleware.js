// API 路由中间件 - 处理所有 /api/ 请求
// 参考旧项目 apiMiddleware.js 的模式：CORS、body 解析、统一错误处理

import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} from './articleService.js';
import {
  getAllTools,
  createTool,
  updateTool,
  deleteTool,
} from './toolService.js';
import {
  getAllPhotos,
  createPhoto,
  deletePhoto,
} from './photoService.js';
import {
  getAllMusic,
  createMusic,
  deleteMusic,
} from './musicService.js';
import {
  getAllLinks,
  createLink,
  updateLink,
  deleteLink,
  approveLink,
  rejectLink,
} from './linkService.js';
import {
  login as authLogin,
  verify as verifyToken,
  logout as authLogout,
  changePassword as authChangePassword,
} from './authService.js';
import {
  getSettings,
  updateSettings,
} from './settingsService.js';
import { incrementClicks } from './toolService.js';
import {
  getAllTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
} from './timelineService.js';
import {
  getAbout,
  updateAbout,
} from './aboutService.js';
import { HOT_SOURCES } from './hotSources.js';

// 读取请求体并解析为 JSON（限制 512KB，防止超大请求体 DoS）
const MAX_BODY = 512 * 1024;

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 统一 JSON 响应（前后端同源部署，不再使用 CORS 通配符）
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data));
}

// 从请求头解析 Bearer token
function getToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return '';
}

// 获取客户端 IP（支持反向代理转发头，仅取第一跳）
function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
}

// 60s 新闻缓存（内存缓存 30 分钟）
let cache60s = null;
let cache60sAt = 0;
const CACHE60S_TTL = 30 * 60 * 1000;

async function fetch60s() {
  const now = Date.now();
  if (cache60s && now - cache60sAt < CACHE60S_TTL) return cache60s;
  const res = await fetch('https://60s.viki.moe/v2/60s', {
    headers: {
      'User-Agent': 'new-site/1.0 (https://github.com/vikiboss/60s)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`60s API error: ${res.status}`);
  const json = await res.json();
  cache60s = json;
  cache60sAt = now;
  return json;
}

// ===== 全平台热榜 =====
// 数据源：主站内置抓取（移植自 DailyHotApi）+ 60s API（补小红书/抖音）
// 缓存 10 分钟（热榜更新频繁）
// DHA_BASE：仅在配置了远程 DailyHotApi 实例时使用（云端部署无需）
const HOT_PLATFORMS = {
  // 小红书/抖音（60s API，DailyHotApi 无小红书路由；抖音用 60s 更稳定）
  rednote: { name: '小红书', group: '小红书', source: 's60' },
  douyin: { name: '抖音', group: '其他', source: 's60' },
  // 其余平台（主站内置抓取）
  bilibili: { name: 'B站', group: '其他', source: 'builtin' },
  kuaishou: { name: '快手', group: '其他', source: 'builtin' },
  baidu: { name: '百度', group: '其他', source: 'builtin' },
  toutiao: { name: '头条', group: '其他', source: 'builtin' },
  'qq-news': { name: '腾讯新闻', group: '其他', source: 'builtin' },
  history: { name: '历史上的今天', group: '其他', source: 'builtin' },
};
const hotCache = new Map(); // platform -> { data, at }
const HOT_CACHE_TTL = 10 * 60 * 1000;
const DHA_BASE = process.env.DHA_BASE || 'http://127.0.0.1:6688';

// 归一化榜单条目 -> { title, hot, url, desc }
function normalizeHotItem(item) {
  return {
    title: item.title || item.name || '',
    hot: item.hot_value ?? item.score ?? item.hot ?? '',
    url: item.link || item.url || item.mobileUrl || '',
    desc: item.desc || item.detail || '',
    tag: item.word_type || '', // 小红书"热/新"等标记
  };
}

async function fetchHotBoard(platform) {
  const now = Date.now();
  const cached = hotCache.get(platform);
  if (cached && now - cached.at < HOT_CACHE_TTL) return cached.data;
  const def = HOT_PLATFORMS[platform];
  let items = [];
  let updatedAt = now;
  if (def.source === 's60') {
    // 60s API（小红书/抖音）
    const res = await fetch(`https://60s.viki.moe/v2/${platform}`, {
      headers: {
        'User-Agent': 'new-site/1.0 (https://github.com/vikiboss/60s)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`60s API error: ${res.status}`);
    const json = await res.json();
    items = (Array.isArray(json.data) ? json.data : []).map(normalizeHotItem);
  } else if (def.source === 'builtin') {
    // 主站内置抓取（移植自 DailyHotApi，云端/本地均可用）
    items = await HOT_SOURCES[platform]();
  } else {
    // 远程 DailyHotApi 实例（DHA_BASE 环境变量配置时使用）
    const res = await fetch(`${DHA_BASE}/${platform}?limit=30`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`DailyHotApi error: ${res.status}`);
    const json = await res.json();
    const list = json?.data;
    if (Array.isArray(list)) {
      items = list.map(normalizeHotItem);
      if (json.updateTime) updatedAt = new Date(json.updateTime).getTime();
    }
  }
  const data = { platform, name: def.name, group: def.group, updated_at: new Date(updatedAt).toISOString(), items };
  hotCache.set(platform, { data, at: now });
  return data;
}

// 批量抓取全部平台（每平台最多 limit 条），单平台失败降级为空列表，不阻塞整体
async function fetchAllHotBoards(limit = 10) {
  const now = Date.now();
  const cached = hotCache.get('__all__');
  if (cached && now - cached.at < HOT_CACHE_TTL) return cached.data;
  const boards = await Promise.all(
    Object.entries(HOT_PLATFORMS).map(async ([key, def]) => {
      try {
        const board = await fetchHotBoard(key);
        return { ...board, items: board.items.slice(0, limit) };
      } catch (e) {
        return {
          platform: key,
          name: def.name,
          group: def.group,
          updated_at: new Date().toISOString(),
          items: [],
          error: e.message || '抓取失败',
        };
      }
    })
  );
  const data = { updated_at: new Date(now).toISOString(), boards };
  hotCache.set('__all__', { data, at: now });
  return data;
}

// 鉴权守卫：未登录时返回 401 并结束请求，登录时返回 true
function requireAuth(req, res) {
  if (verifyToken(getToken(req))) return true;
  sendJSON(res, 401, { error: '未登录或登录已过期' });
  return false;
}

// 主路由处理函数
export async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS 预检
  if (method === 'OPTIONS') {
    sendJSON(res, 200, {});
    return;
  }

  try {
    // ===== 认证 =====
    // POST /api/auth/login - 管理员登录（失败限流）
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await readBody(req);
      const result = await authLogin(body.password, getClientIp(req));
      if (!result.ok) {
        sendJSON(res, result.locked ? 429 : 401, { error: result.reason });
        return;
      }
      sendJSON(res, 200, { success: true, token: result.token });
      return;
    }

    // GET /api/auth/me - 校验当前 token 是否有效
    if (path === '/api/auth/me' && method === 'GET') {
      if (!requireAuth(req, res)) return;
      sendJSON(res, 200, { success: true, authenticated: true });
      return;
    }

    // POST /api/auth/logout - 退出登录
    if (path === '/api/auth/logout' && method === 'POST') {
      authLogout(getToken(req));
      sendJSON(res, 200, { success: true });
      return;
    }

    // POST /api/auth/password - 修改密码（需登录）
    if (path === '/api/auth/password' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const result = await authChangePassword(body.oldPassword, body.newPassword);
      if (!result.ok) {
        sendJSON(res, 400, { error: result.reason });
        return;
      }
      sendJSON(res, 200, { success: true });
      return;
    }

    // ===== 站点设置 =====
    // GET /api/settings - 读取站点设置（公开）
    if (path === '/api/settings' && method === 'GET') {
      const settings = await getSettings();
      sendJSON(res, 200, settings);
      return;
    }

    // PUT /api/settings - 保存站点设置（需登录）
    if (path === '/api/settings' && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const settings = await updateSettings(body);
      sendJSON(res, 200, { success: true, settings });
      return;
    }

    // ===== 文章 =====
    // GET /api/articles - 列表（支持 category、search、page、pageSize）
    if (path === '/api/articles' && method === 'GET') {
      const category = url.searchParams.get('category') || undefined;
      const search = url.searchParams.get('search') || undefined;
      const page = Number(url.searchParams.get('page')) || 1;
      const pageSize = Number(url.searchParams.get('pageSize')) || 24;
      const result = await getArticles({ category, search, page, pageSize });
      sendJSON(res, 200, result);
      return;
    }

    // POST /api/articles - 创建文章
    if (path === '/api/articles' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const article = await createArticle(body);
      sendJSON(res, 201, { success: true, article });
      return;
    }

    // /api/articles/:id - GET / PUT / DELETE
    const articleMatch = path.match(/^\/api\/articles\/([^/]+)$/);
    if (articleMatch) {
      const id = decodeURIComponent(articleMatch[1]);
      if (method === 'GET') {
        const article = await getArticleById(id);
        if (!article) {
          sendJSON(res, 404, { error: '文章不存在' });
          return;
        }
        sendJSON(res, 200, { article });
        return;
      }
      if (method === 'PUT') {
        if (!requireAuth(req, res)) return;
        const body = await readBody(req);
        const article = await updateArticle(id, body);
        sendJSON(res, 200, { success: true, article });
        return;
      }
      if (method === 'DELETE') {
        if (!requireAuth(req, res)) return;
        await deleteArticle(id);
        sendJSON(res, 200, { success: true });
        return;
      }
    }

    // ===== 工具 =====
    // GET /api/tools - 列表
    if (path === '/api/tools' && method === 'GET') {
      const tools = await getAllTools();
      sendJSON(res, 200, tools);
      return;
    }

    // POST /api/tools - 创建工具
    if (path === '/api/tools' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const tool = await createTool(body);
      sendJSON(res, 201, { success: true, tool });
      return;
    }

    // POST /api/tools/:id/click - 点击量 +1（公开）
    const toolClickMatch = path.match(/^\/api\/tools\/([^/]+)\/click$/);
    if (toolClickMatch && method === 'POST') {
      const id = decodeURIComponent(toolClickMatch[1]);
      const tool = await incrementClicks(id);
      sendJSON(res, 200, { success: true, clicks: tool.clicks });
      return;
    }

    // /api/tools/:id - PUT / DELETE
    const toolMatch = path.match(/^\/api\/tools\/([^/]+)$/);
    if (toolMatch) {
      const id = decodeURIComponent(toolMatch[1]);
      if (method === 'PUT') {
        if (!requireAuth(req, res)) return;
        const body = await readBody(req);
        const tool = await updateTool(id, body);
        sendJSON(res, 200, { success: true, tool });
        return;
      }
      if (method === 'DELETE') {
        if (!requireAuth(req, res)) return;
        await deleteTool(id);
        sendJSON(res, 200, { success: true });
        return;
      }
    }

    // ===== 照片 =====
    // GET /api/photos - 列表
    if (path === '/api/photos' && method === 'GET') {
      const photos = await getAllPhotos();
      sendJSON(res, 200, photos);
      return;
    }

    // POST /api/photos - 创建照片
    if (path === '/api/photos' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const photo = await createPhoto(body);
      sendJSON(res, 201, { success: true, photo });
      return;
    }

    // /api/photos/:id - DELETE
    const photoMatch = path.match(/^\/api\/photos\/([^/]+)$/);
    if (photoMatch && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = decodeURIComponent(photoMatch[1]);
      await deletePhoto(id);
      sendJSON(res, 200, { success: true });
      return;
    }

    // ===== 音乐日记 =====
    // GET /api/music - 列表
    if (path === '/api/music' && method === 'GET') {
      const music = await getAllMusic();
      sendJSON(res, 200, music);
      return;
    }

    // POST /api/music - 创建音乐日记
    if (path === '/api/music' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const entry = await createMusic(body);
      sendJSON(res, 201, { success: true, entry });
      return;
    }

    // /api/music/:id - DELETE
    const musicMatch = path.match(/^\/api\/music\/([^/]+)$/);
    if (musicMatch && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      const id = decodeURIComponent(musicMatch[1]);
      await deleteMusic(id);
      sendJSON(res, 200, { success: true });
      return;
    }

    // ===== 友链 =====
    // GET /api/links - 获取所有友链
    if (path === '/api/links' && method === 'GET') {
      const links = await getAllLinks();
      sendJSON(res, 200, links);
      return;
    }

    // POST /api/links - 添加友链
    if (path === '/api/links' && method === 'POST') {
      const body = await readBody(req);
      const link = await createLink(body);
      sendJSON(res, 201, { success: true, link });
      return;
    }

    // POST /api/links/:id/approve - 审核通过（需登录）
    const approveMatch = path.match(/^\/api\/links\/([^/]+)\/approve$/);
    if (approveMatch && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const id = decodeURIComponent(approveMatch[1]);
      const link = await approveLink(id);
      sendJSON(res, 200, { success: true, link });
      return;
    }

    // POST /api/links/:id/reject - 审核拒绝（需登录）
    const rejectMatch = path.match(/^\/api\/links\/([^/]+)\/reject$/);
    if (rejectMatch && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const id = decodeURIComponent(rejectMatch[1]);
      const link = await rejectLink(id);
      sendJSON(res, 200, { success: true, link });
      return;
    }

    // /api/links/:id - PUT / DELETE（需登录）
    const linkMatch = path.match(/^\/api\/links\/([^/]+)$/);
    if (linkMatch) {
      const id = decodeURIComponent(linkMatch[1]);
      if (method === 'PUT') {
        if (!requireAuth(req, res)) return;
        const body = await readBody(req);
        const link = await updateLink(id, body);
        sendJSON(res, 200, { success: true, link });
        return;
      }
      if (method === 'DELETE') {
        if (!requireAuth(req, res)) return;
        await deleteLink(id);
        sendJSON(res, 200, { success: true });
        return;
      }
    }

    // ===== 时间轴 =====
    // GET /api/timeline - 列表
    if (path === '/api/timeline' && method === 'GET') {
      const items = await getAllTimeline();
      sendJSON(res, 200, items);
      return;
    }

    // POST /api/timeline - 创建事件（需登录）
    if (path === '/api/timeline' && method === 'POST') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const item = await createTimeline(body);
      sendJSON(res, 201, { success: true, item });
      return;
    }

    // /api/timeline/:id - PUT / DELETE（需登录）
    const timelineMatch = path.match(/^\/api\/timeline\/([^/]+)$/);
    if (timelineMatch) {
      const id = decodeURIComponent(timelineMatch[1]);
      if (method === 'PUT') {
        if (!requireAuth(req, res)) return;
        const body = await readBody(req);
        const item = await updateTimeline(id, body);
        sendJSON(res, 200, { success: true, item });
        return;
      }
      if (method === 'DELETE') {
        if (!requireAuth(req, res)) return;
        await deleteTimeline(id);
        sendJSON(res, 200, { success: true });
        return;
      }
    }

    // ===== 每日 60s 读懂世界 =====
    // GET /api/60s - 代理 vikiboss/60s API（30 分钟缓存）
    if (path === '/api/60s' && method === 'GET') {
      const data = await fetch60s();
      sendJSON(res, 200, data);
      return;
    }

    // ===== 全平台热榜 =====
    // GET /api/hot/:platform - 代理热榜（小红书/社交社区/新闻资讯/生活预警，10 分钟缓存）
    // 顺带返回平台元信息，供前端构建平台网格
    if (path === '/api/hot/platforms' && method === 'GET') {
      const list = Object.entries(HOT_PLATFORMS).map(([key, def]) => ({
        platform: key,
        name: def.name,
        group: def.group,
      }));
      sendJSON(res, 200, { platforms: list });
      return;
    }

    // GET /api/hot/all - 批量抓取全部平台榜单（每平台前 10 条），单平台失败降级
    if (path === '/api/hot/all' && method === 'GET') {
      try {
        const data = await fetchAllHotBoards(10);
        sendJSON(res, 200, data);
      } catch (e) {
        console.error('[api/hot/all] 抓取失败:', e.message);
        sendJSON(res, 502, { error: '全平台热榜抓取失败，请稍后重试' });
      }
      return;
    }

    const hotMatch = path.match(/^\/api\/hot\/([^/]+)$/);
    if (hotMatch && method === 'GET') {
      const platform = decodeURIComponent(hotMatch[1]).toLowerCase();
      if (!(platform in HOT_PLATFORMS)) {
        sendJSON(res, 404, { error: `不支持的平台: ${platform}` });
        return;
      }
      try {
        const data = await fetchHotBoard(platform);
        sendJSON(res, 200, data);
      } catch (e) {
        console.error(`[api/hot/${platform}] 抓取失败:`, e.message);
        sendJSON(res, 502, { error: `${HOT_PLATFORMS[platform].name}热榜抓取失败，请稍后重试` });
      }
      return;
    }

    // ===== 关于页 =====
    // GET /api/about - 获取关于页数据（公开）
    if (path === '/api/about' && method === 'GET') {
      const about = await getAbout();
      sendJSON(res, 200, about);
      return;
    }

    // PUT /api/about - 更新关于页（需登录）
    if (path === '/api/about' && method === 'PUT') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const about = await updateAbout(body);
      sendJSON(res, 200, { success: true, about });
      return;
    }

    // 未匹配到任何路由
    sendJSON(res, 404, { error: 'API not found' });
  } catch (error) {
    console.error('API Error:', error);
    const msg = error.message || 'Internal server error';
    const statusCode =
      msg.includes('不存在') || msg.includes('不可') || msg.includes('必填')
        ? 400
        : 500;
    sendJSON(res, statusCode, { error: msg });
  }
}

export default { handleApi };
