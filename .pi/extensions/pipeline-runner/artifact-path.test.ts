/**
 * Primary-artifact path mapping tests
 *
 * Regression guard for the incident-class "watched file is not a file the step
 * actually produces" (incidents #1, #5, and the step-6 stall on run
 * 2026-05-30T120453Z).
 *
 * The CompletionWatcher polls exactly the path returned by
 * getPrimaryArtifactPath(step). The marker instruction sent to the agent names
 * that same path. So that path MUST be a per-run results file the step reliably
 * creates — never a sibling/other-step output (e.g. flow-summary.md is a step-7
 * output, not a write-spec output).
 *
 * Run: npx tsx .pi/extensions/pipeline-runner/artifact-path.test.ts
 */

import { getPrimaryArtifactPath } from "./index.ts";

const APP = "automation-in-testing";
const FLOW = "public-home";
const RUN = "2026-05-30T120453Z";
const CWD = "/repo";

interface Case {
  name: string;
  step: number;
  expectedRelSuffix: string;
}

const RUN_DIR = `results/${APP}/flows/${FLOW}/${RUN}`;

const cases: Case[] = [
  { name: "step 1 -> run-metadata.json", step: 1, expectedRelSuffix: `${RUN_DIR}/step1-resolve/run-metadata.json` },
  { name: "step 2 -> snapshot.yaml", step: 2, expectedRelSuffix: `${RUN_DIR}/step2-discover/snapshot.yaml` },
  { name: "step 3 -> normalized-selectors.md", step: 3, expectedRelSuffix: `${RUN_DIR}/step3-extract-selectors/normalized-selectors.md` },
  { name: "step 4 -> page-object.draft.ts", step: 4, expectedRelSuffix: `${RUN_DIR}/step4-draft-page-object/page-object.draft.ts` },
  { name: "step 5 -> test-drafts-index.md", step: 5, expectedRelSuffix: `${RUN_DIR}/step5-draft-tests/test-drafts-index.md` },
  // The fix: step 6 (write-spec) must signal completion via a per-run results
  // file it actually creates — NOT flow-summary.md (a step-7 output it never writes).
  { name: "step 6 -> step6-write-spec/write-spec-report.md (per-run, agent-created)", step: 6, expectedRelSuffix: `${RUN_DIR}/step6-write-spec/write-spec-report.md` },
  { name: "step 7 -> test-report.md", step: 7, expectedRelSuffix: `${RUN_DIR}/step7-run-fix/test-report.md` },
  { name: "step 8 -> pipeline-summary.md", step: 8, expectedRelSuffix: `${RUN_DIR}/pipeline-summary.md` },
];

function runTests(): boolean {
  let passed = 0;
  let failed = 0;

  for (const tc of cases) {
    const got = getPrimaryArtifactPath(tc.step, APP, FLOW, RUN, CWD);
    const expected = `${CWD}/${tc.expectedRelSuffix}`;
    const ok = got === expected;
    if (ok) passed++;
    else failed++;
    console.log(`[${ok ? "PASS" : "FAIL"}] ${tc.name}`);
    if (!ok) {
      console.log(`  Expected: ${expected}`);
      console.log(`  Got:      ${got}`);
    }
  }

  // Explicit guard: step 6 must never point at flow-summary.md again.
  const step6 = getPrimaryArtifactPath(6, APP, FLOW, RUN, CWD);
  const step6PointsAtFlowSummary = step6.endsWith("/flow-summary.md");
  if (step6PointsAtFlowSummary) {
    failed++;
    console.log(`[FAIL] step 6 must NOT watch flow-summary.md (write-spec never creates it)`);
    console.log(`  Got: ${step6}`);
  } else {
    passed++;
    console.log(`[PASS] step 6 does not watch flow-summary.md`);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

const success = runTests();
process.exit(success ? 0 : 1);
