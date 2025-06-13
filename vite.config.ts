import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  envDir: '.',
  envPrefix: 'VITE_',
  define: {
    // 确保环境变量在构建时被正确替换
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      mode === 'production'
        ? 'http://101.42.14.209/api/v1'
        : 'http://localhost:8001/api/v1'
    ),
    'import.meta.env.VITE_MONITOR_API_BASE_URL': JSON.stringify(
      mode === 'production'
        ? 'http://101.42.14.209/monitor/api'
        : 'http://localhost:5000/api'
    ),
  },
}))
