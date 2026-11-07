import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      testMatch: ['mobile-swipe.spec.ts', 'ambient-service-theme.mobile.spec.ts', 'work-feedback.mobile.spec.ts'],
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
    {
      name: 'desktop-chromium',
      testMatch: ['responsive-layout.spec.ts', 'theme-toggle.spec.ts', 'ambient-service-theme.spec.ts', 'work-feedback.spec.ts'],
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
