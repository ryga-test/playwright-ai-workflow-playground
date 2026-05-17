#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { load } from 'js-yaml';

const SLUG = /^[a-z0-9-]+$/;
const ENV = /^[A-Z_][A-Z0-9_]*$/;
const IMPLIED_FORBIDDEN = ['create-booking', 'complete-checkout', 'payment', 'delete-data', 'send-external-message'];
const DATE_FORMATS = new Set(['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY']);
const EMAIL_DOMAINS = new Set(['example.test', 'example.com', 'example.org', 'example.net']);

function die(message) {
  console.error(message);
  process.exit(1);
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readYaml(path) {
  return load(readFileSync(path, 'utf8'));
}

function requireString(value, field, file) {
  if (typeof value !== 'string' || value.trim() === '') die(`${file} field ${field} must be a non-empty string`);
  return value;
}

function requireArray(value, field, file) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) die(`${file} field ${field} must be a string array`);
  return value;
}

function unique(items) {
  const out = [];
  for (const item of items) if (!out.includes(item)) out.push(item);
  return out;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatRelativeDate(offsetDays, format) {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = {
    day: pad2(date.getDate()),
    month: pad2(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
  if (format === 'DD/MM/YYYY') return `${parts.day}/${parts.month}/${parts.year}`;
  if (format === 'YYYY-MM-DD') return `${parts.year}-${parts.month}-${parts.day}`;
  return `${parts.month}/${parts.day}/${parts.year}`;
}

function syntheticEmail(flowId, domain, runId) {
  return `${flowId}-${runId.replace(/[^a-zA-Z0-9-]/g, '-')}@${domain}`;
}

// fallow-ignore-next-line complexity
function resolveTestData(value, flowId, runId, path = 'testData') {
  if (Array.isArray(value)) return value.map((item, index) => resolveTestData(item, flowId, runId, `${path}[${index}]`));
  if (!isRecord(value)) return value;
  if (typeof value.strategy === 'string') {
    if (value.strategy === 'relative-date') {
      if (!Number.isInteger(value.offsetDays) || !DATE_FORMATS.has(value.format)) die(`${path} has invalid relative-date strategy`);
      return formatRelativeDate(value.offsetDays, value.format);
    }
    if (value.strategy === 'synthetic-email') {
      if (typeof value.domain !== 'string' || (!EMAIL_DOMAINS.has(value.domain) && !value.domain.endsWith('.test'))) die(`${path} has invalid synthetic-email domain`);
      return syntheticEmail(flowId, value.domain, runId);
    }
    die(`${path} has unsupported testData strategy ${value.strategy}`);
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveTestData(item, flowId, runId, `${path}.${key}`)]));
}

// fallow-ignore-next-line complexity
function validateProfile(app) {
  const file = join('apps', app, 'profile.yaml');
  const profile = readYaml(file);
  if (!isRecord(profile)) die(`${file} must contain an object`);
  if (profile.name !== app || !SLUG.test(profile.name)) die(`${file} name must match app slug`);
  if (typeof profile.baseUrlEnvVar !== 'string' || !ENV.test(profile.baseUrlEnvVar)) die(`${file} has invalid baseUrlEnvVar`);
  if (profile.testTags !== undefined) requireArray(profile.testTags, 'testTags', file).forEach((tag) => !SLUG.test(tag) && die(`${file} tag ${tag} must be a slug`));
  return profile;
}

// fallow-ignore-next-line complexity
function loadFlow(app, fileName, profileTags) {
  const idFromFile = fileName.slice(0, -'.yaml'.length);
  const file = join('apps', app, 'flows', fileName);
  const flow = readYaml(file);
  if (!isRecord(flow)) die(`${file} must contain an object`);
  const id = requireString(flow.id, 'id', file);
  if (!SLUG.test(id)) die(`${file} id must be a slug`);
  if (id !== idFromFile) die(`${file} filename must match id ${id}`);
  if (flow.version !== '1.0') die(`${file} version must be "1.0"`);
  requireString(flow.name, 'name', file);
  requireString(flow.goal, 'goal', file);
  if (!isRecord(flow.auth) || flow.auth.required !== false) die(`${file} auth.required: true is not supported in v1 execution`);
  if (flow.sideEffects !== 'none') die(`${file} sideEffects other than none are not supported in v1 execution`);
  const allowedActions = requireArray(flow.allowedActions, 'allowedActions', file);
  if (allowedActions.length === 0) die(`${file} allowedActions must be non-empty`);
  const forbiddenActions = requireArray(flow.forbiddenActions, 'forbiddenActions', file);
  requireArray(flow.successCriteria, 'successCriteria', file);
  const startPath = flow.startPath ?? '/';
  if (typeof startPath !== 'string' || !startPath.startsWith('/') || startPath.startsWith('//')) die(`${file} startPath must be app-relative`);
  const tags = unique([...(profileTags ?? []), ...(flow.tags ?? [])]);
  if (tags.length === 0) die(`${file} must resolve at least one merged tag`);
  tags.forEach((tag) => !SLUG.test(tag) && die(`${file} tag ${tag} must be a slug`));
  for (const ref of flow.knowledgeRefs ?? []) {
    const normalized = normalize(ref);
    const prefix = normalize(join('knowledge', app));
    if (!normalized.startsWith(`${prefix}/`) || !existsSync(normalized)) die(`${file} knowledgeRef ${ref} must exist under knowledge/${app}/`);
  }
  const effectiveForbiddenActions = unique([...forbiddenActions, ...IMPLIED_FORBIDDEN]);
  return { ...flow, startPath, sourceFile: file, mergedTags: tags, effectiveForbiddenActions };
}

const [app, runId, flowIdArg = process.env.FLOW_ID ?? ''] = process.argv.slice(2);
if (!app || !runId) die('Usage: node scripts/resolve-flows.js <app> <runId> <flowId>');
if (process.env.FLOW_IDS) die('FLOW_IDS is no longer supported. Use singular FLOW_ID.');

const flowId = flowIdArg.trim();
if (!flowId) die('FLOW_ID is required for a pipeline run');
if (flowId.includes(',')) die('FLOW_ID must contain exactly one flow ID, not a comma-separated list');
if (!SLUG.test(flowId)) die(`FLOW_ID ${flowId} must be a slug`);

const profile = validateProfile(app);
const baseUrl = process.env[profile.baseUrlEnvVar];
if (!baseUrl) die(`Missing environment variable ${profile.baseUrlEnvVar}`);

const flowsRoot = join('apps', app, 'flows');
if (!existsSync(flowsRoot)) die(`App ${app} has no flow files; single-flow pipeline runs require apps/${app}/flows/<flow-id>.yaml`);

const availableFlowIds = readdirSync(flowsRoot)
  .filter((name) => name.endsWith('.yaml'))
  .sort()
  .map((name) => name.slice(0, -'.yaml'.length));
if (!availableFlowIds.includes(flowId)) {
  die(`Unknown FLOW_ID "${flowId}" for app ${app}. Available flow IDs: ${availableFlowIds.join(', ')}`);
}

const selected = [loadFlow(app, `${flowId}.yaml`, profile.testTags)];
const runRoot = join('results', app, 'flows', flowId, runId);
const resultRoot = runRoot;
mkdirSync(join(runRoot, 'step1-resolve'), { recursive: true });
writeFileSync(join(runRoot, 'step1-resolve', 'run-metadata.json'), JSON.stringify({
  app,
  flowId,
  runId,
  resultRoot,
  baseUrl,
  profile: { path: join('apps', app, 'profile.yaml'), valid: true, baseUrlEnvVar: profile.baseUrlEnvVar },
  flowMode: 'single-flow',
  selectedFlowIds: selected.map((flow) => flow.id),
  resolvedAt: new Date().toISOString(),
}, null, 2));

const inventoryFlows = [];
for (const flow of selected) {
  const resolvedTestDataPath = join(runRoot, 'resolved-test-data.json');
  if (flow.testData !== undefined) {
    writeFileSync(resolvedTestDataPath, JSON.stringify(resolveTestData(flow.testData, flow.id, runId), null, 2));
  }
  inventoryFlows.push({
    id: flow.id,
    name: flow.name,
    goal: flow.goal,
    startPath: flow.startPath,
    sourceFile: flow.sourceFile,
    mergedTags: flow.mergedTags,
    auth: flow.auth,
    sideEffects: flow.sideEffects,
    allowedActions: flow.allowedActions,
    forbiddenActions: flow.forbiddenActions,
    effectiveForbiddenActions: flow.effectiveForbiddenActions,
    successCriteria: flow.successCriteria,
    outOfScope: flow.outOfScope ?? [],
    knowledgeRefs: flow.knowledgeRefs ?? [],
    resolvedTestDataPath: flow.testData !== undefined ? resolvedTestDataPath : null,
  });
}
writeFileSync(join(runRoot, 'step1-resolve', 'flow-inventory.json'), JSON.stringify({
  app,
  flowId,
  runId,
  resultRoot,
  flowIdInput: flowId,
  selectedFlowIds: selected.map((flow) => flow.id),
  selectedFlows: inventoryFlows,
  flows: inventoryFlows,
}, null, 2));

console.log(JSON.stringify({ app, flowId, runId, resultRoot, selectedFlowIds: selected.map((flow) => flow.id) }, null, 2));
