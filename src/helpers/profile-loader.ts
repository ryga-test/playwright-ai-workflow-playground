import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import type { AppProfile } from '../types/app-profile.js';

export type { AppProfile } from '../types/app-profile.js';

const APP_NAME_PATTERN = /^[a-z0-9-]+$/;
const ENV_VAR_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function assertProfileName(name: unknown, appName: string): string {
  if (typeof name !== 'string' || !APP_NAME_PATTERN.test(name)) {
    throw new Error(`Profile apps/${appName}/profile.yaml has invalid name; expected ${APP_NAME_PATTERN.source}`);
  }
  if (name !== appName) {
    throw new Error(`Profile name "${name}" must match requested app "${appName}"`);
  }
  return name;
}

function assertBaseUrlEnvVar(baseUrlEnvVar: unknown, name: string): string {
  if (typeof baseUrlEnvVar !== 'string' || !ENV_VAR_PATTERN.test(baseUrlEnvVar)) {
    throw new Error(`Profile ${name} has invalid baseUrlEnvVar; expected ${ENV_VAR_PATTERN.source}`);
  }
  return baseUrlEnvVar;
}

function assertOptionalString(value: unknown, errorMessage: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(errorMessage);
  }
  return value;
}

function assertOptionalRunner(value: unknown, name: string): 'native' | 'docker' | undefined {
  if (value === undefined) return undefined;
  if (value !== 'native' && value !== 'docker') {
    throw new Error(`Profile ${name} runner must be "native" or "docker" when provided`);
  }
  return value;
}

function assertOptionalTestTags(value: unknown, name: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!isStringArray(value)) {
    throw new Error(`Profile ${name} testTags must be a string array when provided`);
  }
  return value;
}

function validateProfileShape(value: unknown, appName: string): AppProfile {
  if (!isRecord(value)) {
    throw new Error(`Profile apps/${appName}/profile.yaml must contain a YAML object`);
  }

  const name = assertProfileName(value.name, appName);
  const baseUrlEnvVar = assertBaseUrlEnvVar(value.baseUrlEnvVar, name);
  const authMethod = assertOptionalString(value.authMethod, `Profile ${name} authMethod must be a string when provided`);
  const runner = assertOptionalRunner(value.runner, name);
  const testTags = assertOptionalTestTags(value.testTags, name);
  const storageStatePath = assertOptionalString(value.storageStatePath, `Profile ${name} storageStatePath must be a string when provided`);

  return {
    name,
    baseUrlEnvVar,
    ...(authMethod !== undefined ? { authMethod } : {}),
    ...(runner !== undefined ? { runner } : {}),
    ...(testTags !== undefined ? { testTags } : {}),
    ...(storageStatePath !== undefined ? { storageStatePath } : {}),
  };
}

function assertUniqueProfileName(profile: AppProfile): void {
  const appsRoot = 'apps';
  const matchingProfiles = readdirSync(appsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((directoryName) => {
      try {
        const content = readFileSync(join(appsRoot, directoryName, 'profile.yaml'), 'utf8');
        const parsed = load(content);
        return isRecord(parsed) && parsed.name === profile.name;
      } catch {
        return false;
      }
    });

  if (matchingProfiles.length > 1) {
    throw new Error(`Duplicate app profile name "${profile.name}" found in: ${matchingProfiles.join(', ')}`);
  }
}

export function loadProfile(appName: string): AppProfile {
  if (!APP_NAME_PATTERN.test(appName)) {
    throw new Error(`Invalid app slug "${appName}"; expected ${APP_NAME_PATTERN.source}`);
  }

  const profilePath = join('apps', appName, 'profile.yaml');
  const content = readFileSync(profilePath, 'utf8');
  const parsed = load(content);
  const profile = validateProfileShape(parsed, appName);
  assertUniqueProfileName(profile);
  return profile;
}
