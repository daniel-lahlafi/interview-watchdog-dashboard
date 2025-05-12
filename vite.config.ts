import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { ViteDevServer } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle /desktop-version endpoint
    {
      name: 'desktop-version-plugin',
      configureServer(server: ViteDevServer) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/desktop-version') {
            res.setHeader('Content-Type', 'text/plain');
            res.end('1.0.0');
            return;
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    fs: {
      strict: true
    }
  }
})