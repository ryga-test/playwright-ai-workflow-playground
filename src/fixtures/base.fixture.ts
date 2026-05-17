import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { loadProfile, type AppProfile } from '../helpers/profile-loader.js';
import { getStepDir } from '../helpers/result-paths.js';

dotenv.config();

export interface AppFixtures {
  appConfig: AppProfile;
}

function getScreencastOutputDir(appName: string, runId: string): string {
  const flowId = process.env.FLOW_ID;
  if (!flowId) throw new Error('FLOW_ID is required when PLAYWRIGHT_RUN_ID is set');
  return getStepDir(appName, flowId, runId, 'step7-run-fix');
}

export const test = base.extend<AppFixtures>({
  appConfig: async ({}, use) => {
    const appName = process.env.APP_NAME ?? 'example';
    await use(loadProfile(appName));
  },

  baseURL: async ({ appConfig }, use) => {
    const resolvedBaseUrl = process.env[appConfig.baseUrlEnvVar];

    if (!resolvedBaseUrl) {
      throw new Error(`Missing environment variable ${appConfig.baseUrlEnvVar} for app ${appConfig.name}`);
    }

    await use(resolvedBaseUrl);
  },

  page: async ({ page }, use, testInfo) => {
    const runId = process.env.PLAYWRIGHT_RUN_ID;

    if (!runId) {
      // Local run: no screencast recording
      await use(page);
      return;
    }

    // Pipeline run: enable screencast with action annotations and chapter overlays
    const appName = process.env.APP_NAME ?? 'example';
    const outputDir = getScreencastOutputDir(appName, runId);
    const videoPath = path.join(outputDir, `${testInfo.title}.webm`);

    fs.mkdirSync(outputDir, { recursive: true });

    await page.screencast.start({
      path: videoPath,
      size: page.viewportSize() ?? { width: 1280, height: 720 },
    });

    // Enable visual action annotations (red dots + labels on clicks/fills/hovers)
    await page.screencast.showActions();

    // Show start-of-test chapter overlay
    await page.screencast.showChapter(testInfo.title, {
      description: 'Test starting…',
      duration: 2000,
    });

    try {
      await use(page);
    } finally {
      // Show end-of-test status chapter (best-effort — page may be closed)
      try {
        const status = testInfo.status ?? 'unknown';
        const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏸️';
        await page.screencast.showChapter(`${emoji} ${testInfo.title}`, {
          description: `Status: ${status}`,
          duration: 3000,
        });
      } catch {
        // Page may be disposed; ignore
      }

      // Stop screencast and finalize video file
      try {
        await page.screencast.stop();
      } catch {
        // Already stopped; ignore
      }
    }
  },
});

export { expect };
