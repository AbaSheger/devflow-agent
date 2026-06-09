import { defineConfig, devices } from '@playwright/test';

const isLocalScreenshot = process.env.LOCAL_SCREENSHOT === 'true';
const baseURL = isLocalScreenshot ? 'http://127.0.0.1:5173' : 'https://devflow-agent.vercel.app/';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: isLocalScreenshot
    ? {
        command: 'npm run dev -- --host 127.0.0.1',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : undefined,
});
