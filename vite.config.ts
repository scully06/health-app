// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //【追加】開発サーバーが .xlsx ファイルを正しく認識できるようにする
  server: {
    watch: {
      usePolling: true,
    },
    // これにより、不明なパスへのリクエストがindex.htmlにフォールバックするのを
    // 特定の状況で制御しやすくなりますが、今回は主にパスの指定方法が重要です。
  },
  //【追加】ビルド時に .xlsx ファイルをアセットとして扱う
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
})