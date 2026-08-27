// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Suite Configuration
 * Barcode Restaurant Group E-Commerce Platform
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.CLIENT_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari (iPhone)',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: 'npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: false,
      }
    : undefined,
});
