// fallow-ignore-file unused-file
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures++;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// --- Module 1: Pipeline Agent Definition ---

const agentPath = resolve(ROOT, '.opencode/agents/pipeline.md');
let agentContent;
try {
  agentContent = readFileSync(agentPath, 'utf-8');
} catch {
  console.error('FATAL: .opencode/agents/pipeline.md not found');
  process.exit(1);
}

const frontmatterMatch = agentContent.match(/^---\n([\s\S]*?)\n---/);
assert(frontmatterMatch !== null, 'Agent file has YAML frontmatter');

const frontmatter = frontmatterMatch?.[1] ?? '';
assert(frontmatter.includes('description:'), 'Frontmatter has description field');
assert(frontmatter.includes('mode: primary'), 'Frontmatter has mode: primary');

const body = agentContent.split('---').slice(2).join('---');
assert(body.includes('adapters/opencode/capabilities.yaml'), 'Prompt references capabilities.yaml');

const stepNames = ['resolve', 'discover', 'extract-selectors', 'draft-page-object', 'draft-tests', 'write-spec', 'run-fix', 'summarize'];
for (const step of stepNames) {
  assert(body.toLowerCase().includes(step), `Prompt covers step: ${step}`);
}

assert(body.includes('GATE') || body.includes('gate'), 'Prompt mentions gated steps');
assert(body.includes('approved') || body.includes('approval'), 'Prompt mentions approval protocol');
assert(body.includes('pipeline/<app>/<flowId>/<runId>'), 'Prompt mentions branch creation pattern');

// --- Module 2: opencode.json Configuration ---

const configPath = resolve(ROOT, 'opencode.json');
let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf-8'));
} catch {
  console.error('FATAL: opencode.json not found or invalid JSON');
  process.exit(1);
}

assert(config.$schema === 'https://opencode.ai/config.json', 'Config has correct $schema');
assert(config.command?.pipeline !== undefined, 'Config has command.pipeline entry');
assert(config.command?.pipeline?.template !== undefined, 'command.pipeline has template');
assert(config.command?.pipeline?.agent === 'pipeline', 'command.pipeline routes to pipeline agent');
assert(config.agent?.pipeline !== undefined, 'Config has agent.pipeline entry');
assert(config.agent?.pipeline?.mode === 'primary', 'agent.pipeline has mode: primary');

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures > 0 ? 1 : 0);
