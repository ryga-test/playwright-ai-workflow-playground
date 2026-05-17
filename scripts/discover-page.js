#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const runMetadataPath = process.argv[2] || join('results/automation-in-testing/flows/section-navigation/2026-05-17T100540Z', 'step1-resolve', 'run-metadata.json');
const metadata = JSON.parse(readFileSync(runMetadataPath, 'utf8'));

const { app, flowId, runId, resultRoot, baseUrl } = metadata;
const startPath = '/';
const url = `${baseUrl}${startPath}`;
const discoverDir = join(resultRoot, 'step2-discover');
const pathsDir = join(discoverDir, 'paths');

mkdirSync(pathsDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

console.log(`Navigating to ${url}...`);
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

const ariaSnapshot = await page.locator('body').ariaSnapshot();
const title = await page.title();

// Path-level snapshot
const pathSnapshotYaml = [
  `path: ${startPath}`,
  `url: ${url}`,
  `title: ${title}`,
  'actions:',
  '  - navigate to /',
  'snapshot:',
  ariaSnapshot.split('\n').map(l => `  ${l}`).join('\n'),
].join('\n');

writeFileSync(join(pathsDir, 'home.snapshot.yaml'), pathSnapshotYaml);

// Merged snapshot
const mergedYaml = [
  `app: ${app}`,
  `flowId: ${flowId}`,
  `runId: "${runId}"`,
  `baseUrl: ${baseUrl}`,
  `startPath: ${startPath}`,
  `url: ${url}`,
  `title: ${title}`,
  'paths:',
  '  - path: /',
  '    artifact: paths/home.snapshot.yaml',
  '    actions:',
  '      - navigate to /',
  'snapshot:',
  ariaSnapshot.split('\n').map(l => `  ${l}`).join('\n'),
].join('\n');

writeFileSync(join(discoverDir, 'snapshot.yaml'), mergedYaml);

// Selector candidates
const candidates = `# Selector candidates: automation-in-testing / section-navigation

Run ID: \`${runId}\`  
Start path: \`${startPath}\`  
Path provenance: \`${startPath}\` — home page, no interactions.

## Preferred locators

| Purpose | Candidate | Priority | Provenance | Notes |
|---|---|---:|---|---|
| Logo/home link | \`page.getByRole('link', { name: 'Shady Meadows B&B' })\` | role | \`/\` | Navigates to home. |
| Rooms nav link | \`page.getByRole('link', { name: 'Rooms' })\` | role | \`/\` | Hash anchor to /#rooms. |
| Booking nav link | \`page.getByRole('link', { name: 'Booking' })\` | role | \`/\` | Hash anchor to /#booking. |
| Amenities nav link | \`page.getByRole('link', { name: 'Amenities' })\` | role | \`/\` | Hash anchor to /#amenities. |
| Location nav link | \`page.getByRole('link', { name: 'Location' })\` | role | \`/\` | Hash anchor to /#location. |
| Contact nav link | \`page.getByRole('link', { name: 'Contact' })\` | role | \`/\` | Hash anchor to /#contact. |
| Home heading | \`page.getByRole('heading', { name: 'Welcome to Shady Meadows B&B' })\` | role | \`/\` | Confirms home page loaded. |

## Guardrails

- Do not click Admin link; admin navigation is out of scope.
- Do not click Book Now links; booking/checkout is out of scope.
- Assert section visibility via heading presence after hash navigation.
- Prefer \`getByRole\` for stable accessible selectors.
`;

writeFileSync(join(discoverDir, 'selector-candidates.md'), candidates);

// Discovery metadata
const discoveryMeta = {
  app,
  flowId,
  runId,
  resultRoot,
  baseUrl,
  selectedFlowIds: [flowId],
  startPaths: [startPath],
  artifacts: {
    mergedSnapshot: join(discoverDir, 'snapshot.yaml'),
    pathSnapshots: [join(pathsDir, 'home.snapshot.yaml')],
    selectorCandidates: join(discoverDir, 'selector-candidates.md'),
  },
  discoveryStatus: 'completed',
};
writeFileSync(join(discoverDir, 'discovery-metadata.json'), JSON.stringify(discoveryMeta, null, 2));

await browser.close();
console.log(`Discovery complete. Artifacts written to ${discoverDir}`);
