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

// 读取请求体并解析为 JSON
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
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

// 统一 JSON 响应（含 CORS 头）
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
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
        const body = await readBody(req);
        const article = await updateArticle(id, body);
        sendJSON(res, 200, { success: true, article });
        return;
      }
      if (method === 'DELETE') {
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
      const body = await readBody(req);
      const tool = await createTool(body);
      sendJSON(res, 201, { success: true, tool });
      return;
    }

    // /api/tools/:id - PUT / DELETE
    const toolMatch = path.match(/^\/api\/tools\/([^/]+)$/);
    if (toolMatch) {
      const id = decodeURIComponent(toolMatch[1]);
      if (method === 'PUT') {
        const body = await readBody(req);
        const tool = await updateTool(id, body);
        sendJSON(res, 200, { success: true, tool });
        return;
      }
      if (method === 'DELETE') {
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
      const body = await readBody(req);
      const photo = await createPhoto(body);
      sendJSON(res, 201, { success: true, photo });
      return;
    }

    // /api/photos/:id - DELETE
    const photoMatch = path.match(/^\/api\/photos\/([^/]+)$/);
    if (photoMatch && method === 'DELETE') {
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
      const body = await readBody(req);
      const entry = await createMusic(body);
      sendJSON(res, 201, { success: true, entry });
      return;
    }

    // /api/music/:id - DELETE
    const musicMatch = path.match(/^\/api\/music\/([^/]+)$/);
    if (musicMatch && method === 'DELETE') {
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

    // POST /api/links/:id/approve - 审核通过
    const approveMatch = path.match(/^\/api\/links\/([^/]+)\/approve$/);
    if (approveMatch && method === 'POST') {
      const id = decodeURIComponent(approveMatch[1]);
      const link = await approveLink(id);
      sendJSON(res, 200, { success: true, link });
      return;
    }

    // POST /api/links/:id/reject - 审核拒绝
    const rejectMatch = path.match(/^\/api\/links\/([^/]+)\/reject$/);
    if (rejectMatch && method === 'POST') {
      const id = decodeURIComponent(rejectMatch[1]);
      const link = await rejectLink(id);
      sendJSON(res, 200, { success: true, link });
      return;
    }

    // /api/links/:id - PUT / DELETE
    const linkMatch = path.match(/^\/api\/links\/([^/]+)$/);
    if (linkMatch) {
      const id = decodeURIComponent(linkMatch[1]);
      if (method === 'PUT') {
        const body = await readBody(req);
        const link = await updateLink(id, body);
        sendJSON(res, 200, { success: true, link });
        return;
      }
      if (method === 'DELETE') {
        await deleteLink(id);
        sendJSON(res, 200, { success: true });
        return;
      }
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
