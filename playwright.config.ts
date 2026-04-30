import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { loadProfile } from './src/helpers/profile-loader.js';

dotenv.config();

const appName = process.env.APP_NAME ?? 'example';
const profile = loadProfile(appName);
const runId = process.env.PLAYWRIGHT_RUN_ID ?? 'local-run';
const baseURL = process.env[profile.baseUrlEnvVar] ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  outputDir: `results/${profile.name}/${runId}/test-results`,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'example',
      testDir: './tests/example',
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
      },
    },
  ],
});
