import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  resolve: {
    alias: {
      // '@': './src',

      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      // external: ['react'],
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          framer_motion: ['framer-motion'],
        },
      },
    },
  },
})
