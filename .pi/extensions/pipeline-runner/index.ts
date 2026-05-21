/**
 * Pipeline Runner Extension
 *
 * Automates the 8-step E2E test pipeline defined in .pi/prompts/pipeline-*.md.
 * Each pipeline run creates its own git branch, switches to it, and runs the
 * entire pipeline on that branch. Pauses at gated steps (4: draft page object,
 * 5: draft tests) for human approval. Non-gated steps chain automatically.
 *
 * Commands:
 *   /pipeline-run <app> FLOW_ID=<flow-id> — Start pipeline from step 1 (creates branch, switches)
 *   /pipeline-continue     — Send "approved" to agent and resume after gate
 *   /pipeline-status       — Show current pipeline progress
 *   /pipeline-reset        — Reset / abort, switch back to original branch, delete pipeline branch
 *
 * Pipeline steps:
 *   1. pipeline-resolve            (auto)
 *   2. pipeline-discover           (auto)
 *   3. pipeline-extract-selectors  (auto)
 *   4. pipeline-draft-page-object  (GATED — pause for /pipeline-continue)
 *   5. pipeline-draft-tests        (GATED — pause for /pipeline-continue)
 *   6. pipeline-write-spec         (auto)
 *   7. pipeline-run-fix            (auto)
 *   8. pipeline-summarize          (auto)
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ────────────────────────────────────────────────────────────────────

interface PipelineState {
  app: string;
  flowId: string;
  runId: string | null;
  currentStep: number; // 0 = not started, 1-8 = active step
  status: "running" | "paused_gate" | "complete";
  gateApprovals: { step4: boolean; step5: boolean };
  originalBranch: string | null; // branch to return to on reset
}

const STEP_NAMES: Record<number, string> = {
  1: "pipeline-resolve",
  2: "pipeline-discover",
  3: "pipeline-extract-selectors",
  4: "pipeline-draft-page-object",
  5: "pipeline-draft-tests",
  6: "pipeline-write-spec",
  7: "pipeline-run-fix",
  8: "pipeline-summarize",
};

const GATED_STEPS = new Set([4, 5]);
const TOTAL_STEPS = 8;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate ISO 8601 run ID: YYYY-MM-DDTHHMMSSZ */
function parsePipelineRunArgs(args: string): { app: string; flowId: string | null; error: string | null } {
  const parts = args.trim().split(/\s+/).filter(Boolean);
  const app = parts[0] ?? "";
  const flowArg = parts.slice(1).join(" ").trim();
  if (!flowArg) return { app, flowId: null, error: "Usage: /pipeline-run <app> FLOW_ID=<flow-id>" };
  if (flowArg.startsWith("FLOW_IDS=") || flowArg.startsWith("--flows=")) {
    return { app, flowId: null, error: "FLOW_IDS/--flows are no longer supported. Use FLOW_ID=<flow-id>." };
  }
  if (!flowArg.startsWith("FLOW_ID=")) {
    return { app, flowId: null, error: "Flow argument must use FLOW_ID=<flow-id>." };
  }
  const flowId = flowArg.replace(/^FLOW_ID=/, "").trim();
  if (!flowId) return { app, flowId: null, error: "FLOW_ID is required." };
  if (flowId.includes(",")) return { app, flowId: null, error: "FLOW_ID must contain exactly one flow ID." };
  return { app, flowId, error: null };
}

function flowContextLines(app: string, flowId: string): string {
  return `FLOW_ID: ${flowId}\nResolve exactly one flow from apps/${app}/flows/${flowId}.yaml.\n`;
}

function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/** Get the current git branch name */
async function currentBranch(pi: ExtensionAPI): Promise<string | null> {
  const r = await pi.exec("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const name = r.stdout.trim();
  return name || null;
}

/** Check if a git branch exists (local only) */
async function branchExists(pi: ExtensionAPI, name: string): Promise<boolean> {
  const r = await pi.exec("git", ["branch", "--list", name]);
  return r.stdout.trim() !== "";
}

// ── Extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  let pipeline: PipelineState | null = null;

  /**
   * Tracking: set when we dispatch a pipeline step prompt.
   * agent_end checks this to distinguish pipeline-driven turns from
   * user-driven turns and to know which step just completed.
   */
  let pendingPipelineStep: number | null = null;

  /**
   * Tracking: set when /pipeline-continue sends "approved" to the agent.
   * agent_end uses this to chain to the next real step after approval
   * completes. Contains { nextDispatchStep } — the step to dispatch after
   * the agent finishes processing the "approved" message.
   */
  let pendingGateApproval: { nextDispatchStep: number } | null = null;

  // ── Persistence ──────────────────────────────────────────────────────────

  function persistState() {
    if (pipeline) {
      pi.appendEntry("pipeline-state", pipeline);
    }
  }

  // ── Run ID extraction ────────────────────────────────────────────────────

  /**
   * After step 1 completes, scan results/<app>/flows/<flow-id>/ for the most recent
   * run directory that contains step1-resolve/run-metadata.json.
   */
  function findRunId(app: string, flowId: string, cwd: string): string | null {
    const resultsDir = path.join(cwd, "results", app, "flows", flowId);
    if (!fs.existsSync(resultsDir)) return null;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(resultsDir, { withFileTypes: true });
    } catch {
      return null;
    }

    // Sort descending — newest timestamp-format directory first
    const dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .reverse();

    for (const dir of dirs) {
      const metadataPath = path.join(
        resultsDir,
        dir,
        "step1-resolve",
        "run-metadata.json",
      );
      if (fs.existsSync(metadataPath)) {
        return dir;
      }
    }

    return null;
  }

  // ── Step dispatch ────────────────────────────────────────────────────────

  /**
   * Send a pipeline step prompt as a user message to the agent.
   * Sets pendingPipelineStep so agent_end knows to chain.
   */
  function dispatchStep(step: number) {
    if (!pipeline) return;

    const app = pipeline.app;
    const runId = pipeline.runId;
    const stepName = STEP_NAMES[step];
    if (!stepName || !runId) return;

    let message: string;
    if (step === 1) {
      // Step 1: pre-generated runId; tell the agent to use it directly
      message =
        `/pipeline-resolve ${app} ${runId}\n\n` +
        flowContextLines(app, pipeline.flowId) +
        `Resolve inputs for the ${app} application:\n` +
        `1. Load and validate \`apps/${app}/profile.yaml\`\n` +
        `2. Read the profile's \`baseUrlEnvVar\` field and check that env var is set in \`.env\`\n` +
        `3. The run ID is already generated: **${runId}**. Use this exact value.\n` +
        `4. Prefer running \`node scripts/resolve-flows.js ${app} ${runId} ${pipeline.flowId}\` to validate the profile and selected flow, then write artifacts\n` +
        `5. Validate only \`apps/${app}/flows/${pipeline.flowId}.yaml\`; unrelated flow files must not block this run\n` +
        `6. Write run metadata to \`results/${app}/flows/${pipeline.flowId}/${runId}/step1-resolve/run-metadata.json\` with \`app\`, \`flowId\`, \`runId\`, \`resultRoot\`, \`baseUrl\`, profile validation status, and selected flow IDs\n` +
        `7. Write flow inventory to \`results/${app}/flows/${pipeline.flowId}/${runId}/step1-resolve/flow-inventory.json\` and resolved test data under \`results/${app}/flows/${pipeline.flowId}/${runId}/resolved-test-data.json\`\n` +
        `8. Report the run ID and selected flow clearly — they will be needed for all subsequent steps`;
    } else {
      message = `/${stepName} ${app} ${runId}\n\n${flowContextLines(app, pipeline.flowId)}`;
    }

    pipeline.currentStep = step;
    if (GATED_STEPS.has(step)) {
      pipeline.status = "paused_gate";
    } else {
      pipeline.status = "running";
    }
    persistState();

    pendingPipelineStep = step;
    pi.sendUserMessage(message, { deliverAs: "followUp" });
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  pi.registerCommand("pipeline-run", {
    description:
      "Run the E2E test pipeline for one app flow (pauses at gated steps 4 & 5). Each run creates its own git branch and switches to it.",
    handler: async (args, ctx) => {
      const { app, flowId, error } = parsePipelineRunArgs(args);
      if (!app || error || !flowId) {
        ctx.ui.notify(error ?? "Usage: /pipeline-run <app> FLOW_ID=<flow-id>", "error");
        return;
      }

      if (pipeline && pipeline.status !== "complete") {
        ctx.ui.notify(
          `Pipeline already running for "${pipeline.app}" at step ${pipeline.currentStep}/8. ` +
            "Use /pipeline-continue or /pipeline-reset.",
          "warning",
        );
        return;
      }

      // Generate run ID upfront
      const runId = generateRunId();

      // Remember the original branch so we can switch back on reset
      const origBranch = await currentBranch(pi);
      if (!origBranch) {
        ctx.ui.notify("Could not determine current git branch.", "error");
        return;
      }

      const branchName = `pipeline/${app}/${flowId}/${runId}`;

      // Delete stale branch if it exists from a previous aborted run
      if (await branchExists(pi, branchName)) {
        await pi.exec("git", ["branch", "-D", branchName]);
      }

      // Create new branch from current HEAD and switch to it
      const checkoutResult = await pi.exec("git", [
        "checkout", "-b", branchName,
      ]);

      if (checkoutResult.code !== 0) {
        ctx.ui.notify(
          `Failed to create/switch to branch "${branchName}": ${checkoutResult.stderr || checkoutResult.stdout}`,
          "error",
        );
        return;
      }

      ctx.ui.notify(
        `📋 Run ID: ${runId}\n` +
        `🌿 Branch: ${branchName} (switched from ${origBranch})`,
        "info",
      );

      pipeline = {
        app,
        runId,
        currentStep: 0,
        status: "running",
        flowId,
        gateApprovals: { step4: false, step5: false },
        originalBranch: origBranch,
      };
      persistState();

      ctx.ui.notify(
        `🚀 Pipeline started for "${app}" flow "${flowId}" — step 1/8 (resolve)`,
        "info",
      );
      dispatchStep(1);
    },
  });

  pi.registerCommand("pipeline-continue", {
    description:
      "Send 'approved' to the agent so it promotes gated artifacts, then advance pipeline",
    handler: async (_args, ctx) => {
      if (!pipeline || pipeline.status !== "paused_gate") {
        ctx.ui.notify(
          "No pipeline waiting at a gate. Use /pipeline-run <app> FLOW_ID=<flow-id> to start.",
          "warning",
        );
        return;
      }

      const step = pipeline.currentStep;

      let nextDispatchStep: number;
      if (step === 4 && !pipeline.gateApprovals.step4) {
        pipeline.gateApprovals.step4 = true;
        nextDispatchStep = 5;
      } else if (step === 5 && !pipeline.gateApprovals.step5) {
        pipeline.gateApprovals.step5 = true;
        nextDispatchStep = 6;
      } else {
        ctx.ui.notify(
          `Gate step ${step} already approved. Use /pipeline-status.`,
          "info",
        );
        return;
      }

      persistState();

      pendingGateApproval = { nextDispatchStep };
      pi.sendUserMessage("approved", { deliverAs: "followUp" });

      ctx.ui.notify(
        `✅ Sent approval for step ${step}/8. Agent promoting artifacts, then ` +
          `advancing to step ${nextDispatchStep}/8...`,
        "success",
      );
    },
  });

  pi.registerCommand("pipeline-status", {
    description: "Show current pipeline status",
    handler: async (_args, ctx) => {
      if (!pipeline) {
        ctx.ui.notify(
          "No pipeline active. Use /pipeline-run <app> FLOW_ID=<flow-id> to start.",
          "info",
        );
        return;
      }

      const stepPad = (n: number) =>
        n === pipeline!.currentStep ? "▶" : " ";
      const gateStatus = (n: number) => {
        if (!GATED_STEPS.has(n)) return "";
        const approved =
          n === 4
            ? pipeline!.gateApprovals.step4
            : pipeline!.gateApprovals.step5;
        return approved ? " [approved]" : " [awaiting approval]";
      };

      const progressLines = Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const done =
          n < pipeline!.currentStep ||
          (n === pipeline!.currentStep &&
            pipeline!.status === "complete");
        const marker = done ? "✓" : stepPad(n);
        return `  ${marker} ${n}/8 ${STEP_NAMES[n]}${gateStatus(n)}`;
      });

      const lines = [
        `Pipeline: ${pipeline.app}`,
        `Flow:    ${pipeline.flowId}`,
        `Run ID:  ${pipeline.runId ?? "(pending)"}`,
        `Branch:  pipeline/${pipeline.app}/${pipeline.flowId}/${pipeline.runId ?? "?"}`,
        `Original: ${pipeline.originalBranch ?? "(unknown)"}`,
        `Status:  ${pipeline.status}`,
        `Progress:`,
        ...progressLines,
      ];

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  pi.registerCommand("pipeline-reset", {
    description: "Abort the current pipeline, switch back to original branch, delete pipeline branch",
    handler: async (_args, ctx) => {
      if (!pipeline) {
        ctx.ui.notify("No pipeline to reset.", "info");
        return;
      }

      const app = pipeline.app;
      const runId = pipeline.runId;
      const origBranch = pipeline.originalBranch;
      const pipelineBranch = runId
        ? `pipeline/${app}/${pipeline.flowId}/${runId}`
        : null;

      if (origBranch && pipelineBranch) {
        ctx.ui.notify(
          `🧹 Switching back to ${origBranch} and deleting ${pipelineBranch}...`,
          "info",
        );

        // Force-switch back to original branch (discard uncommitted pipeline changes)
        try {
          await pi.exec("git", ["checkout", "-f", origBranch]);
        } catch {
          ctx.ui.notify(
            `Failed to switch back to ${origBranch}. You may need to do this manually.`,
            "error",
          );
        }

        // Delete the pipeline branch
        try {
          await pi.exec("git", ["branch", "-D", pipelineBranch]);
        } catch {
          // ignore — branch may already be gone
        }
      }

      pipeline = null;
      pendingPipelineStep = null;
      pendingGateApproval = null;
      pi.appendEntry("pipeline-state", null);

      ctx.ui.notify(`Pipeline for "${app}" reset.`, "info");
    },
  });

  // ── Auto-advance on agent_end ─────────────────────────────────────────────

  pi.on("agent_end", async (_event, ctx) => {
    if (!pipeline) return;

    // ── Case 1: Gate approval just completed ─────────────────────────────
    if (pendingGateApproval) {
      const { nextDispatchStep } = pendingGateApproval;
      pendingGateApproval = null;

      if (GATED_STEPS.has(nextDispatchStep)) {
        ctx.ui.notify(
          `⏸  Step ${nextDispatchStep}/8 (${STEP_NAMES[nextDispatchStep]}) is GATED — ` +
            "review the output and use /pipeline-continue to proceed.",
          "warning",
        );
      }

      await new Promise((r) => setTimeout(r, 300));
      dispatchStep(nextDispatchStep);
      return;
    }

    // ── Case 2: A pipeline step turn just completed ──────────────────────
    if (pendingPipelineStep === null) return;

    const completedStep = pendingPipelineStep;
    pendingPipelineStep = null;

    if (pipeline.status === "paused_gate") {
      return;
    }

    // After step 1, verify the run ID from the results directory
    if (completedStep === 1 && pipeline.runId) {
      const detectedRunId = findRunId(pipeline.app, pipeline.flowId, ctx.cwd);
      if (detectedRunId) {
        if (detectedRunId !== pipeline.runId) {
          ctx.ui.notify(
            `⚠️ Run ID mismatch: expected ${pipeline.runId}, found ${detectedRunId}. Using detected.`,
            "warning",
          );
          pipeline.runId = detectedRunId;
        } else {
          ctx.ui.notify(`📍 Verified run ID: ${detectedRunId}`, "info");
        }
        persistState();
      } else {
        ctx.ui.notify(
          "⚠️ Could not detect run ID from step 1 output. " +
            "Pipeline paused. Check results/<app>/flows/<flow-id>/ and use /pipeline-run to restart.",
          "warning",
        );
        pipeline.status = "paused_gate";
        persistState();
        return;
      }
    }

    // Determine next step
    const nextStep = completedStep + 1;
    if (nextStep > TOTAL_STEPS) {
      pipeline.status = "complete";
      persistState();
      ctx.ui.notify(
        `🎉 Pipeline complete! All 8 steps finished.\n` +
          `   Branch: pipeline/${pipeline.app}/${pipeline.flowId}/${pipeline.runId}\n` +
          `   Original: ${pipeline.originalBranch}\n` +
          `   Use \`git checkout ${pipeline.originalBranch}\` to go back, ` +
          `or commit and merge from here.`,
        "success",
      );
      return;
    }

    if (GATED_STEPS.has(nextStep)) {
      ctx.ui.notify(
        `⏸  Step ${nextStep}/8 (${STEP_NAMES[nextStep]}) is GATED — ` +
          "review the output and use /pipeline-continue to proceed.",
        "warning",
      );
    }

    await new Promise((r) => setTimeout(r, 300));
    dispatchStep(nextStep);
  });

  // ── Restore pipeline state on session start ──────────────────────────────

  pi.on("session_start", async (_event, ctx) => {
    const branch = ctx.sessionManager.getBranch();
    for (let i = branch.length - 1; i >= 0; i--) {
      const entry = branch[i];
      if (
        entry.type === "custom" &&
        entry.customType === "pipeline-state"
      ) {
        const data = entry.data as PipelineState | null | undefined;
        if (data && data.app && data.status && data.status !== "complete") {
          pipeline = data;
          ctx.ui.notify(
            `📋 Restored pipeline: "${pipeline.app}" at step ${pipeline.currentStep}/8 (${pipeline.status})\n` +
              `   Flow: ${pipeline.flowId}\n` +
              `   Branch: pipeline/${pipeline.app}/${pipeline.flowId}/${pipeline.runId ?? "?"}\n` +
              `   Original: ${pipeline.originalBranch ?? "(unknown)"}`,
            "info",
          );
        }
        break;
      }
    }
  });
}
