#!/usr/bin/env node
// Open the generated Playwright HTML report in the system default browser.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openDefaultBrowser } from './open-default-browser.js';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const REPORT = join(ROOT, 'playwright-report', 'index.html');

if (!existsSync(REPORT)) {
  console.error(`Playwright report not found: ${REPORT}`);
  console.error('Run `npm test` first to generate playwright-report/index.html.');
  process.exit(1);
}

const reportUrl = pathToFileURL(REPORT).href;
openDefaultBrowser(reportUrl);
console.log(`🌐 Opened ${reportUrl}`);
