// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { // この server オブジェクト全体を確認
    proxy: {
      // '/api'で始まるリクエストは、すべて target に転送する
      '/api': {
        target: 'http://localhost:3001', // バックエンドサーバーのURL
        changeOrigin: true, // オリジンを変更する
        // secure: false, // (もしHTTPSのエラーが出る場合はこれも試す)
      }
    }
  }
})