import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { handleApi } from './server/apiMiddleware.js';
import { proxyHandler } from './server/proxyService.js';

// 挂载 /api/ 与资源代理中间件（开发与预览共用）
function apiAndProxyPlugin() {
  const mount = (server: any) => {
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = req.url || '';
      if (url.startsWith('/api/')) {
        handleApi(req, res).catch(next);
      } else if (url.startsWith('/res-proxy') || url.startsWith('/img-proxy')) {
        proxyHandler(req, res).catch(next);
      } else {
        next();
      }
    });
  };
  return {
    name: 'api-and-resource-proxy',
    configureServer: mount,
    configurePreviewServer: mount,
  };
}

export default defineConfig({
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          markdown: ['react-markdown', 'remark-gfm'],
          charts: ['recharts'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5174,
  },
  plugins: [react(), tsconfigPaths(), apiAndProxyPlugin()],
})
