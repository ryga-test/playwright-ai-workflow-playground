import { test as base, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { loadProfile, type AppProfile } from '../helpers/profile-loader.js';

dotenv.config();

export interface AppFixtures {
  appConfig: AppProfile;
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
});

export { expect };
