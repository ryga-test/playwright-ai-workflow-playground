import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function generateRunId(): string {
  const iso = new Date().toISOString();
  return `${iso.slice(0, 10)}T${iso.slice(11, 19).replaceAll(':', '')}Z`;
}

export function writeArtifact(app: string, runId: string, step: string, filename: string, content: string): string {
  const directory = join('results', app, runId, step);
  const artifactPath = join(directory, filename);

  if (existsSync(artifactPath)) {
    throw new Error(`Refusing to overwrite existing artifact: ${artifactPath}`);
  }

  mkdirSync(directory, { recursive: true });
  writeFileSync(artifactPath, content, 'utf8');
  return artifactPath;
}
