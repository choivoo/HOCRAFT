import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(existsSync);
const launchOptions = { ...(exe ? { executablePath: exe } : {}), args: ['--no-sandbox'] };
const base = { browserName: 'chromium' as const, hasTouch: true, isMobile: true, deviceScaleFactor: 2, launchOptions };

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.results',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'portrait', use: { ...base, viewport: { width: 390, height: 844 } } },
    { name: 'landscape', use: { ...base, viewport: { width: 844, height: 390 } } },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
