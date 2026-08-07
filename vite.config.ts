import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function makeCsp(mode: string, backendUrl: string): string {
  // 'wasm-unsafe-eval' برای موتور pdf.js لازم است (در کروم جدا از 'unsafe-eval' است)
  const base = `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: ${backendUrl}; font-src 'self' data:; media-src 'self' blob: data: ${backendUrl}; object-src 'self' ${backendUrl}; frame-src 'self' ${backendUrl} blob: data:; connect-src 'self' ${backendUrl}; worker-src 'self' blob:`;
  if (mode === 'development') {
    return base.replace("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'", "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'");
  }
  return base;
}

export default defineConfig(({ mode }) => {
  // آدرس بک‌اند — دقیقاً منطبق با src/lib/constants.ts
  const backendUrl = mode === 'development'
    ? 'http://127.0.0.1:8000'
    : 'http://172.16.10.10:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      headers: {
        'Content-Security-Policy': makeCsp(mode, backendUrl),
      },
      proxy: {
        '/certificate': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
