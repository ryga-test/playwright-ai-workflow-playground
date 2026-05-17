import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { resolveSelectedFlow } from './src/helpers/flow-loader.js';
import { loadProfile } from './src/helpers/profile-loader.js';
import { getFlowRunRoot } from './src/helpers/result-paths.js';

dotenv.config();

const appName = process.env.APP_NAME ?? 'example';
const profile = loadProfile(appName);
const runId = process.env.PLAYWRIGHT_RUN_ID ?? 'local-run';
const baseURL = process.env[profile.baseUrlEnvVar] ?? 'http://localhost:3000';
if (process.env.FLOW_IDS) {
  throw new Error('FLOW_IDS is no longer supported. Use singular FLOW_ID.');
}

const hasExplicitApp = process.env.APP_NAME !== undefined;
const selectedFlow = process.env.FLOW_ID || hasExplicitApp
  ? resolveSelectedFlow(profile.name, process.env.FLOW_ID, profile.testTags)
  : null;
const selectedFlowTestMatch = selectedFlow ? [`${selectedFlow.id}.spec.ts`] : [];
const flowRunRoot = selectedFlow ? getFlowRunRoot(profile.name, selectedFlow.id, runId) : null;
const outputDir = flowRunRoot
  ? `${flowRunRoot}/test-results`
  : `results/${profile.name}/${runId}/test-results`;
const htmlReportDir = flowRunRoot ? `${flowRunRoot}/step7-run-fix/playwright-report` : 'playwright-report';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  outputDir,
  reporter: [
    ['html', { outputFolder: htmlReportDir }],
    ['list'],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: profile.name,
      testDir: `./tests/${profile.name}`,
      ...(selectedFlowTestMatch.length > 0 ? { testMatch: selectedFlowTestMatch } : {}),
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
      },
    },
  ],
});
