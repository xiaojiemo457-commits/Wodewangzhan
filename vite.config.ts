import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { handleApi } from './server/apiMiddleware.js';

export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  server: {
    port: 5174,
  },
  plugins: [
    react(),
    tsconfigPaths(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              await handleApi(req, res);
            } catch (err) {
              next(err);
            }
          } else {
            next();
          }
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              await handleApi(req, res);
            } catch (err) {
              next(err);
            }
          } else {
            next();
          }
        });
      },
    },
    {
      name: 'resource-proxy',
      configureServer(server) {
        async function proxyHandler(req: any, res: any) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) { res.statusCode = 400; res.end('Missing url'); return; }

          let fixed = targetUrl.trim();
          fixed = fixed.replace(/https:\/\/https?:\/\//gi, 'https://');
          fixed = fixed.replace(/http:\/\/https?:\/\//gi, 'https://');
          if (fixed.startsWith('//')) fixed = 'https:' + fixed;

          let parsed: URL;
          try { parsed = new URL(fixed); } catch { res.statusCode = 400; res.end('Invalid URL'); return; }
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') { res.statusCode = 403; res.end('Bad protocol'); return; }

          const response = await fetch(parsed.toString(), {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Accept-Encoding': 'identity' },
            cache: 'no-store', redirect: 'follow',
          });
          if (!response.ok && response.status !== 206) { res.statusCode = response.status; res.end('Fetch failed'); return; }

          const ct = response.headers.get('content-type') || 'application/octet-stream';
          res.setHeader('Content-Type', ct);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Accept-Ranges', 'bytes');
          if (ct.includes('image')) res.setHeader('Cache-Control', 'public, max-age=31536000');
          else if (ct.includes('audio')) res.setHeader('Cache-Control', 'public, max-age=3600');
          else res.setHeader('Cache-Control', 'no-store');

          res.statusCode = response.status;
          if (response.body) {
            const reader = response.body.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(Buffer.from(value));
              }
              res.end();
            } catch { if (!res.headersSent) { res.statusCode = 500; res.end('Stream error'); } }
          } else { res.end(); }
        }
        server.middlewares.use('/res-proxy', proxyHandler);
        server.middlewares.use('/img-proxy', proxyHandler);
      },
      configurePreviewServer(server) {
        async function proxyHandler(req: any, res: any) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) { res.statusCode = 400; res.end('Missing url'); return; }
          let fixed = targetUrl.trim();
          if (fixed.startsWith('//')) fixed = 'https:' + fixed;
          let parsed: URL;
          try { parsed = new URL(fixed); } catch { res.statusCode = 400; res.end('Invalid URL'); return; }
          const response = await fetch(parsed.toString(), {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Accept-Encoding': 'identity' },
            cache: 'no-store', redirect: 'follow',
          });
          const ct = response.headers.get('content-type') || 'application/octet-stream';
          res.setHeader('Content-Type', ct);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Accept-Ranges', 'bytes');
          res.statusCode = response.status;
          if (response.body) {
            const reader = response.body.getReader();
            try { while (true) { const { done, value } = await reader.read(); if (done) break; res.write(Buffer.from(value)); } res.end(); }
            catch { if (!res.headersSent) { res.statusCode = 500; res.end('Stream error'); } }
          } else { res.end(); }
        }
        server.middlewares.use('/res-proxy', proxyHandler);
        server.middlewares.use('/img-proxy', proxyHandler);
      },
    },
  ],
})
