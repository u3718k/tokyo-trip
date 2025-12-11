import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 重要：這裡的 base 必須換成你的 GitHub Repository 名稱
  // 例如你的 repo 叫 'tokyo-trip'，這裡就是 '/tokyo-trip/'
  // 如果你是用 username.github.io 的 repo，這裡請改為 '/'
  base: '/tokyo-trip/', 
  build: {
    outDir: 'dist',
  }
})