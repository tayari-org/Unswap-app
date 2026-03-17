import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.VITE_PORT || '5173');
  const apiBase = env.VITE_API_BASE_URL;

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port,
      strictPort: true,
      hmr: { port, clientPort: port, host: 'localhost', protocol: 'ws' },
      proxy: {
        '/api': { target: apiBase, changeOrigin: true },
        '/uploads': { target: apiBase, changeOrigin: true },
      },
    },
  };
});