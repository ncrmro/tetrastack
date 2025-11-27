import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom environment to enable DOM APIs for React component testing
    environment: 'happy-dom',

    // Only include component tests in this config
    include: ['tests/components/**/*.test.{ts,tsx}'],

    // Share the same setup files as main vitest config
    // vitest.test-setup.ts already imports @testing-library/jest-dom matchers
    setupFiles: ['./vitest.test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
