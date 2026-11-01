import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4180',
    // Offline reload isn't tested here, and a service worker update could reload the page mid-test.
    serviceWorkers: 'block',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: '../server',
      // This route also checks the database, so the run stops early if it is down.
      url: 'http://localhost:5000/health',
      reuseExistingServer: true,
    },
    {
      command: 'npm run build && npm run preview -- --port 4180 --strictPort',
      url: 'http://localhost:4180',
      // Always test a fresh build, never a preview that is already running.
      reuseExistingServer: false,
    },
  ],
})
