/**
 * Gate-continue single-dispatch tests (incident #7 regression)
 *
 * Root cause (run 2026-05-30T132439Z, policy-links): `/pipeline-continue` sent
 * TWO `pi.sendUserMessage(...)` calls in the same synchronous tick — "approved"
 * (to promote the gated draft) and then the next-step dispatch. The first send
 * starts an agent turn; the second races the agent's transition into
 * "processing" and is silently dropped (incident #1 Bug #4 mechanism: prompt()
 * throws "Agent is already processing", the un-awaited rejection is swallowed).
 * The next step never runs and the pipeline stalls at the gate. It is a RACE, so
 * it is intermittent — the same code advanced the gate on run 120453Z and
 * dropped step 5 on run 132439Z.
 *
 * Every working transition (pipeline-run start, non-gated auto-chain) issues
 * exactly ONE message to an idle agent. This test pins that invariant onto the
 * gate path: `/pipeline-continue` must issue exactly one sendUserMessage, and it
 * must carry BOTH the approval ("approved" + promote the draft) and the next
 * step's command — so the fold-into-one-message fix cannot regress back to two
 * sends or accidentally drop the next-step dispatch.
 *
 * This is the first test that exercises the dispatch loop (not just the
 * regex/path) — the gap every prior incident postmortem flagged.
 *
 * Run: npx tsx .pi/extensions/pipeline-runner/gate-continue-single-dispatch.test.ts
 */

import extension from "./index.ts";

interface SendCall {
  message: string;
  options: any;
}

function makeMockPi() {
  const commands: Record<string, { handler: (args: string, ctx: any) => any }> = {};
  const events: Record<string, (event: any, ctx: any) => any> = {};
  const sends: SendCall[] = [];
  const pi: any = {
    registerCommand: (name: string, def: any) => {
      commands[name] = def;
    },
    on: (event: string, handler: any) => {
      events[event] = handler;
    },
    sendUserMessage: (message: string, options: any) => {
      sends.push({ message, options });
      return Promise.resolve();
    },
    appendEntry: (_type: string, _data: any) => {},
    exec: async (_cmd: string, _args: string[]) => ({ code: 0, stdout: "", stderr: "" }),
  };
  return { pi, commands, events, sends };
}

/** Build a ctx whose session restore injects a pipeline paused at a gate step. */
function restoreCtxAtGate(step: number) {
  return {
    cwd: "/repo",
    ui: { notify: () => {} },
    sessionManager: {
      getBranch: () => [
        {
          type: "custom",
          customType: "pipeline-state",
          data: {
            app: "automation-in-testing",
            flowId: "policy-links",
            runId: "2026-05-30T132439Z",
            currentStep: step,
            status: "paused_gate",
            gateApprovals: { step4: false, step5: false },
            originalBranch: "main",
            stepMarkerReceived: true,
          },
        },
      ],
    },
  };
}

async function continueAtGate(step: number): Promise<SendCall[]> {
  const { pi, commands, events, sends } = makeMockPi();
  extension(pi);

  // Restore the pipeline into paused_gate at `step` (no need to run the whole
  // pipeline / git / fs — session restore is the supported injection point).
  await events["session_start"]({}, restoreCtxAtGate(step));

  // Approve the gate.
  await commands["pipeline-continue"].handler("", { cwd: "/repo", ui: { notify: () => {} } });

  return sends;
}

async function runTests(): Promise<boolean> {
  let passed = 0;
  let failed = 0;

  const check = (name: string, ok: boolean, detail?: string) => {
    if (ok) passed++;
    else failed++;
    console.log(`[${ok ? "PASS" : "FAIL"}] ${name}`);
    if (!ok && detail) console.log(`  ${detail}`);
  };

  // ── Gate 4 (page-object review) → step 5 ──
  {
    const sends = await continueAtGate(4);
    check(
      "gate 4 continue issues EXACTLY ONE sendUserMessage (not two — the race)",
      sends.length === 1,
      `Expected 1 send, got ${sends.length}: ${JSON.stringify(sends.map((s) => s.message.slice(0, 40)))}`,
    );
    const msg = sends.map((s) => s.message).join("\n");
    check(
      "the single message carries the approval ('approved')",
      sends.length === 1 && /(^|\n)approved\b/.test(sends[0].message),
      `Message head: ${JSON.stringify(msg.slice(0, 80))}`,
    );
    check(
      "the single message carries the next step's command (/pipeline-draft-tests)",
      sends.length === 1 && sends[0].message.includes("/pipeline-draft-tests"),
      `Message did not include /pipeline-draft-tests`,
    );
    check(
      "the single message uses deliverAs: followUp",
      sends.length === 1 && sends[0].options?.deliverAs === "followUp",
      `Options: ${JSON.stringify(sends[0]?.options)}`,
    );
  }

  // ── Gate 5 (test-draft review) → step 6 ──
  {
    const sends = await continueAtGate(5);
    check(
      "gate 5 continue issues EXACTLY ONE sendUserMessage",
      sends.length === 1,
      `Expected 1 send, got ${sends.length}`,
    );
    check(
      "the single message carries the next step's command (/pipeline-write-spec)",
      sends.length === 1 && sends[0].message.includes("/pipeline-write-spec"),
      `Message did not include /pipeline-write-spec`,
    );
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

runTests().then((ok) => process.exit(ok ? 0 : 1));
