import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function apiPlugin() {
  return {
    name: 'express-api-plugin',
    async configureServer(server: any) {
      try {
        const { app } = await import('./server/index');
        // Only route /api requests to Express; let Vite handle all frontend assets & HMR
        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.url && (req.url.startsWith('/api') || req.originalUrl?.startsWith('/api'))) {
            return app(req, res, next);
          }
          next();
        });
      } catch (err) {
        console.error('Failed to mount express in vite dev server:', err);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/*.db', '**/*.db-*', '**/*.sqlite*'],
      },
    },
  };
});
