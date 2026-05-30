/**
 * CompletionMarker regex tests
 *
 * Verifies the watcher regex (from CompletionWatcher.poll)
 * correctly detects @step-complete markers across all supported artifact formats.
 *
 * Run: npx tsx .pi/extensions/pipeline-runner/marker-regex.test.ts
 */

// Exact regex from CompletionWatcher.poll()
function buildMarkerRegex(step: number): RegExp {
  return new RegExp(`@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)`);
}

interface TestCase {
  name: string;
  step: number;
  content: string;
  expectMatch: boolean;
}

const SAMPLE_RUN_ID = "2026-05-30T065319Z";

const cases: TestCase[] = [
  // ── Comment-based formats (steps 2-6,8: md/yaml) ──
  {
    name: "Markdown last line",
    step: 2,
    content: "Some content\n\n<!-- @step-complete step=2 runId=2026-05-30T065319Z -->\n",
    expectMatch: true,
  },
  {
    name: "YAML last line",
    step: 3,
    content: "alert: empty\n\n# @step-complete step=3 runId=2026-05-30T065319Z\n",
    expectMatch: true,
  },
  {
    name: "TypeScript last line",
    step: 4,
    content: "export class Page {}\n// @step-complete step=4 runId=2026-05-30T065319Z\n",
    expectMatch: true,
  },

  // ── JSON format (step 1 primary artifact) ──
  {
    name: "JSON _stepComplete key before closing brace (full file tail)",
    step: 1,
    content: '  "baseUrl": "https://example.com",\n  "_stepComplete": "@step-complete step=1 runId=2026-05-30T065319Z"\n}',
    expectMatch: true,
  },
  {
    name: "JSON _stepComplete key (last 512 bytes - watcher scan)",
    step: 1,
    content: '"flowId": "public-home","_stepComplete":"@step-complete step=1 runId=2026-05-30T065319Z"}',
    expectMatch: true,
  },
  {
    name: "JSON without marker (just closing brace)",
    step: 1,
    content: '  "baseUrl": "https://example.com"\n}',
    expectMatch: false,
  },
  {
    name: "JSON marker in wrong step",
    step: 1,
    content: '  "_stepComplete": "@step-complete step=2 runId=2026-05-30T065319Z"\n}',
    expectMatch: false,
  },

  // ── Gherkin format ──
  {
    name: "Gherkin (test-drafts-index.md, step 5)",
    step: 5,
    content: "| ... | ... |\n\n# @step-complete step=5 runId=2026-05-30T065319Z approved\n",
    expectMatch: true,
  },

  // ── Run ID with trailing newline ──
  {
    name: "Marker followed by blank line (trailing newline)",
    step: 7,
    content: "## Summary\n\n# @step-complete step=7 runId=2026-05-30T065319Z\n\n",
    expectMatch: true,
  },
];

function runTests() {
  let passed = 0;
  let failed = 0;

  for (const tc of cases) {
    const regex = buildMarkerRegex(tc.step);
    const match = regex.test(tc.content);

    const status = match === tc.expectMatch ? "PASS" : "FAIL";
    if (status === "PASS") passed++;
    else failed++;

    console.log(`[${status}] ${tc.name}`);
    if (status === "FAIL") {
      console.log(`  Expected match=${tc.expectMatch}, got match=${match}`);
      console.log(`  Regex: ${regex}`);
      console.log(`  Tail: ${JSON.stringify(tc.content.slice(-120))}`);
    }
  }

  console.log(`\n${passed}/${cases.length} passed, ${failed} failed`);
  return failed === 0;
}

const success = runTests();
process.exit(success ? 0 : 1);
