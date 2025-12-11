import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // 외부 접근 허용
    watch: {
      usePolling: true, // 파일 변경 감지 개선
    },
    hmr: {
      overlay: true, // 에러 오버레이 표시
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})

