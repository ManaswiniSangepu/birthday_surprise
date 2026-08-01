import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Each test chains several 1.21s page turns; give them plenty of headroom.
    testTimeout: 20000,
  },
})
