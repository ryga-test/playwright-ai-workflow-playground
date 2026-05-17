#!/usr/bin/env node
// Open the generated Playwright HTML report in the system default browser.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openDefaultBrowser } from './open-default-browser.js';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const appName = process.env.APP_NAME;
const flowId = process.env.FLOW_ID;
const runId = process.env.PLAYWRIGHT_RUN_ID;
const REPORT = appName && flowId && runId
  ? join(ROOT, 'results', appName, 'flows', flowId, runId, 'step7-run-fix', 'playwright-report', 'index.html')
  : join(ROOT, 'playwright-report', 'index.html');

if (!existsSync(REPORT)) {
  console.error(`Playwright report not found: ${REPORT}`);
  console.error('Run `npm test` first, or set APP_NAME, FLOW_ID, and PLAYWRIGHT_RUN_ID to open a flow run report.');
  process.exit(1);
}

const reportUrl = pathToFileURL(REPORT).href;
openDefaultBrowser(reportUrl);
console.log(`🌐 Opened ${reportUrl}`);
