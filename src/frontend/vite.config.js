import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    env: { VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? 'http://api.test' },
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.spec.{js,jsx}'], // đuôi .spec để lệnh `node --test` ở thư mục gốc không chạy nhầm
  },
});
