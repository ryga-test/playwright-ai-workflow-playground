import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { load } from 'js-yaml';
import type { FlowDefinition, ResolvedFlow } from '../types/flow.js';

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const IMPLIED_FORBIDDEN_FOR_READ_ONLY = [
  'create-booking',
  'complete-checkout',
  'payment',
  'delete-data',
  'send-external-message',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string, flowPath: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${flowPath} field ${field} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string, flowPath: string): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${flowPath} field ${field} must be a string array`);
  }
  return value;
}

function optionalStringArray(value: unknown, field: string, flowPath: string): string[] | undefined {
  if (value === undefined) return undefined;
  return requireStringArray(value, field, flowPath);
}

function assertSlug(value: string, label: string, flowPath: string): void {
  if (!SLUG_PATTERN.test(value)) {
    throw new Error(`${flowPath} ${label} "${value}" must match ${SLUG_PATTERN.source}`);
  }
}

// fallow-ignore-next-line complexity
function mergeTags(profileTags: string[] | undefined, flowTags: string[] | undefined, flowPath: string): string[] {
  const merged: string[] = [];
  for (const tag of [...(profileTags ?? []), ...(flowTags ?? [])]) {
    assertSlug(tag, 'tag', flowPath);
    if (!merged.includes(tag)) merged.push(tag);
  }
  if (merged.length === 0) {
    throw new Error(`${flowPath} must resolve at least one merged tag`);
  }
  return merged;
}

// fallow-ignore-next-line complexity
function validateKnowledgeRefs(appName: string, refs: string[] | undefined, flowPath: string): void {
  for (const ref of refs ?? []) {
    const normalized = normalize(ref);
    const prefix = normalize(join('knowledge', appName));
    if (!normalized.startsWith(`${prefix}/`) || !existsSync(normalized)) {
      throw new Error(`${flowPath} knowledgeRef ${ref} must exist under knowledge/${appName}/`);
    }
  }
}

function validateStartPath(startPath: string | undefined, flowPath: string): void {
  if (startPath !== undefined && (!startPath.startsWith('/') || startPath.startsWith('//'))) {
    throw new Error(`${flowPath} startPath must be app-relative`);
  }
}

function validateReadOnlySafety(flow: FlowDefinition, flowPath: string): void {
  if (flow.auth.required) {
    throw new Error(`${flowPath} auth.required: true is not supported in v1 execution`);
  }
  if (flow.sideEffects !== 'none') {
    throw new Error(`${flowPath} sideEffects ${flow.sideEffects} is not supported in v1 execution`);
  }
}

// fallow-ignore-next-line complexity
function parseFlow(value: unknown, appName: string, filenameId: string, flowPath: string, profileTags?: string[]): ResolvedFlow {
  if (!isRecord(value)) {
    throw new Error(`${flowPath} must contain a YAML object`);
  }

  const auth = value.auth;
  if (!isRecord(auth) || typeof auth.required !== 'boolean') {
    throw new Error(`${flowPath} auth.required is required and must be boolean`);
  }

  const flow: FlowDefinition = {
    version: requireString(value.version, 'version', flowPath) as FlowDefinition['version'],
    id: requireString(value.id, 'id', flowPath),
    name: requireString(value.name, 'name', flowPath),
    goal: requireString(value.goal, 'goal', flowPath),
    ...(value.startPath !== undefined ? { startPath: requireString(value.startPath, 'startPath', flowPath) } : {}),
    ...(value.tags !== undefined ? { tags: requireStringArray(value.tags, 'tags', flowPath) } : {}),
    auth: { required: auth.required },
    sideEffects: requireString(value.sideEffects, 'sideEffects', flowPath) as FlowDefinition['sideEffects'],
    allowedActions: requireStringArray(value.allowedActions, 'allowedActions', flowPath),
    forbiddenActions: requireStringArray(value.forbiddenActions, 'forbiddenActions', flowPath),
    successCriteria: requireStringArray(value.successCriteria, 'successCriteria', flowPath),
    ...(value.outOfScope !== undefined ? { outOfScope: optionalStringArray(value.outOfScope, 'outOfScope', flowPath) } : {}),
    ...(value.knowledgeRefs !== undefined ? { knowledgeRefs: requireStringArray(value.knowledgeRefs, 'knowledgeRefs', flowPath) } : {}),
    ...(value.notes !== undefined ? { notes: requireString(value.notes, 'notes', flowPath) } : {}),
    ...(value.testData !== undefined ? { testData: value.testData as Record<string, unknown> } : {}),
  };

  if (flow.version !== '1.0') {
    throw new Error(`${flowPath} version must be "1.0"`);
  }
  assertSlug(flow.id, 'id', flowPath);
  if (flow.id !== filenameId) {
    throw new Error(`${flowPath} filename must match id "${flow.id}"`);
  }
  validateStartPath(flow.startPath, flowPath);
  validateKnowledgeRefs(appName, flow.knowledgeRefs, flowPath);
  validateReadOnlySafety(flow, flowPath);

  const mergedTags = mergeTags(profileTags, flow.tags, flowPath);
  const effectiveForbiddenActions = [...flow.forbiddenActions];
  for (const action of IMPLIED_FORBIDDEN_FOR_READ_ONLY) {
    if (!effectiveForbiddenActions.includes(action)) effectiveForbiddenActions.push(action);
  }

  return {
    ...flow,
    sourceFile: flowPath,
    mergedTags,
    effectiveForbiddenActions,
  };
}

function loadFlows(appName: string, profileTags?: string[]): ResolvedFlow[] {
  const flowsRoot = join('apps', appName, 'flows');
  if (!existsSync(flowsRoot)) return [];

  return readdirSync(flowsRoot)
    .filter((fileName) => fileName.endsWith('.yaml'))
    .sort()
    .map((fileName) => {
      const filenameId = fileName.slice(0, -'.yaml'.length);
      const flowPath = join(flowsRoot, fileName);
      const parsed = load(readFileSync(flowPath, 'utf8'));
      return parseFlow(parsed, appName, filenameId, flowPath, profileTags);
    });
}

// fallow-ignore-next-line complexity
export function resolveSelectedFlows(appName: string, flowIdsInput: string | undefined, profileTags?: string[]): ResolvedFlow[] {
  const flows = loadFlows(appName, profileTags);
  if (flows.length === 0) {
    if (flowIdsInput?.trim()) {
      throw new Error(`FLOW_IDS was provided, but app ${appName} has no flow files`);
    }
    return [];
  }

  if (!flowIdsInput?.trim()) return flows;

  const requestedIds = flowIdsInput.split(',').map((id) => id.trim()).filter(Boolean);
  const duplicateIds = requestedIds.filter((id, index) => requestedIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new Error(`Duplicate FLOW_IDS are not allowed: ${[...new Set(duplicateIds)].join(', ')}`);
  }

  const byId = new Map(flows.map((flow) => [flow.id, flow]));
  const unknownIds = requestedIds.filter((id) => !byId.has(id));
  if (unknownIds.length > 0) {
    throw new Error(`Unknown FLOW_IDS for app ${appName}: ${unknownIds.join(', ')}`);
  }

  return requestedIds.map((id) => byId.get(id)!);
}
