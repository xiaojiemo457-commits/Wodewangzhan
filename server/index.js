// 生产服务器入口 - 处理 /api/ 路由并提供静态文件服务
// 参考旧项目 server/index.js 的模式

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { handleApi } from './apiMiddleware.js';
import { LINKS_FILE } from './linkService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || fileURLToPath(new URL('.', import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DIST_DIR = join(PROJECT_ROOT, 'dist');

// 静态文件的 MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
};

// 统一 JSON 响应
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// 提供静态文件服务（含 SPA 回退到 index.html）
async function serveStatic(req, res, urlPath) {
  try {
    // 安全：规范化路径，防止目录穿越
    const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(DIST_DIR, safePath);

    // 如果路径以 / 结尾或指向目录，则尝试 index.html
    let info;
    try {
      info = await stat(filePath);
    } catch {
      // 文件不存在，回退到 SPA index.html
      await serveIndex(res);
      return;
    }

    if (info.isDirectory()) {
      filePath = join(filePath, 'index.html');
      try {
        await stat(filePath);
      } catch {
        await serveIndex(res);
        return;
      }
    }

    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    console.error('Static file error:', error);
    await serveIndex(res);
  }
}

// 返回 index.html（SPA 回退）
async function serveIndex(res) {
  try {
    const indexPath = join(DIST_DIR, 'index.html');
    const data = await readFile(indexPath);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}

// 创建 HTTP 服务器
const PORT = process.env.PORT || 3002;
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // CORS 预检
  if (req.method === 'OPTIONS') {
    sendJSON(res, 200, {});
    return;
  }

  // API 路由
  if (path.startsWith('/api/')) {
    try {
      await handleApi(req, res);
    } catch (err) {
      console.error('Unhandled API error:', err);
      sendJSON(res, 500, { error: 'Internal server error' });
    }
    return;
  }

  // 静态文件服务
  await serveStatic(req, res, path);
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 数据存储: ${LINKS_FILE}`);
  console.log(`📦 静态文件: ${DIST_DIR}\n`);
});

export { server };
