// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { UserConfig as VitestUserConfigInterface } from 'vitest/config';
import "@testing-library/jest-dom"

// Vitestのための設定を定義
const vitestConfig: VitestUserConfigInterface['test'] = {
  globals: true,
  environment: 'jsdom',
  setupFiles: './vitest.setup.ts',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/health-app/', // GitHub Pages用の設定
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.xlsx')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  // Viteの設定にテスト設定をマージ
  test: vitestConfig,
});
