/**
 * Pipeline Runner Extension
 *
 * Automates the 8-step E2E test pipeline defined in .pi/prompts/pipeline-*.md.
 * Each pipeline run creates its own git branch + worktree so runs are fully
 * isolated. Pauses at gated steps (4: draft page object, 5: draft tests) for
 * human approval. Non-gated steps chain automatically.
 *
 * Commands:
 *   /pipeline-run <app>    — Start pipeline from step 1
 *   /pipeline-continue     — Send "approved" to agent and resume after gate
 *   /pipeline-status       — Show current pipeline progress
 *   /pipeline-reset        — Reset / abort the current pipeline, remove worktree
 *
 * Pipeline steps:
 *   1. pipeline-resolve            (auto)
 *   2. pipeline-discover           (auto)
 *   3. pipeline-extract-selectors  (auto)
 *   4. pipeline-draft-page-object  (GATED — pause for human "approved")
 *   5. pipeline-draft-tests        (GATED — pause for human "approved")
 *   6. pipeline-write-spec         (auto)
 *   7. pipeline-run-fix            (auto)
 *   8. pipeline-summarize          (auto)
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ── Types ────────────────────────────────────────────────────────────────────

interface PipelineState {
  app: string;
  runId: string | null;
  currentStep: number; // 0 = not started, 1-8 = active step
  status: "running" | "paused_gate" | "complete";
  gateApprovals: { step4: boolean; step5: boolean };
  worktree: string | null; // path to isolated git worktree for this run
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
function generateRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

/** Check if a git branch exists (local or remote) */
async function branchExists(pi: ExtensionAPI, name: string): Promise<boolean> {
  const r = await pi.exec("git", ["branch", "--list", name]);
  return r.stdout.trim() !== "";
}

/**
 * Clean up a pipeline worktree and its branch.
 * Never throws — failures are logged to stderr.
 */
async function removeWorktree(
  pi: ExtensionAPI,
  worktreePath: string,
  branchName: string,
) {
  // Remove worktree (prune the administrative files)
  try {
    if (fs.existsSync(worktreePath)) {
      await pi.exec("git", ["worktree", "remove", "--force", worktreePath]);
    }
  } catch {
    // Worktree may already be gone; try pruning
    try {
      await pi.exec("git", ["worktree", "prune"]);
    } catch {
      // ignore
    }
  }

  // Force-delete the branch
  try {
    await pi.exec("git", ["branch", "-D", branchName]);
  } catch {
    // ignore — branch may already be deleted
  }
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
   * After step 1 completes, scan the worktree's results/<app>/ for
   * the most recent run directory that contains step1-resolve/run-metadata.json.
   * Since we pre-generate runId, this is a fallback sanity check.
   */
  function findRunId(app: string, worktree: string): string | null {
    const resultsDir = path.join(worktree, "results", app);
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
   *
   * All prompts include a worktree header so the agent targets the
   * isolated worktree for all file operations and bash commands.
   */
  function dispatchStep(step: number) {
    if (!pipeline) return;

    const app = pipeline.app;
    const runId = pipeline.runId;
    const worktree = pipeline.worktree;
    const stepName = STEP_NAMES[step];
    if (!stepName || !runId || !worktree) return;

    // Build the worktree header
    const worktreeHeader = [
      `## ⚠️ WORKTREE CONTEXT`,
      ``,
      `This pipeline run operates in an isolated git worktree at:`,
      `  **${worktree}**`,
      ``,
      `- All file paths below are relative to this worktree.`,
      `- When using bash, always \`cd ${worktree}\` first (or use absolute paths).`,
      `- Use \`read\`, \`write\`, \`edit\` with paths relative to \`${worktree}\`.`,
      `- The worktree is on branch \`pipeline/${app}/${runId}\`.`,
      ``,
      `---`,
      ``,
    ].join("\n");

    // Build the step-specific prompt (same as before, but with worktree context)
    let message: string;
    if (step === 1) {
      // Step 1: We pre-generated the runId, so tell the agent to use it directly
      message =
        worktreeHeader +
        `/pipeline-resolve ${app} ${runId}\n\n` +
        `Resolve inputs for the ${app} application:\n` +
        `1. Load and validate \`apps/${app}/profile.yaml\` (in the worktree)\n` +
        `2. Read the profile's \`baseUrlEnvVar\` field and check that env var is set in \`.env\` (the worktree has a copy of .env)\n` +
        `3. The run ID is already generated: **${runId}**. Use this exact value.\n` +
        `4. Write run metadata to \`results/${app}/${runId}/step1-resolve/run-metadata.json\` with \`app\`, \`runId\`, \`baseUrl\`, profile validation status\n` +
        `5. Report the run ID clearly — it will be needed for all subsequent steps`;
    } else {
      message = worktreeHeader + `/${stepName} ${app} ${runId}`;
    }

    pipeline.currentStep = step;
    if (GATED_STEPS.has(step)) {
      pipeline.status = "paused_gate";
    } else {
      pipeline.status = "running";
    }
    persistState();

    pendingPipelineStep = step;
    pi.sendUserMessage(message);
  }

  // ── Worktree setup ───────────────────────────────────────────────────────

  /**
   * Create an isolated worktree for a pipeline run.
   * Returns { worktree, branchName } or throws.
   */
  async function setupWorktree(
    cwd: string,
    app: string,
    runId: string,
  ): Promise<{ worktree: string; branchName: string }> {
    const branchName = `pipeline/${app}/${runId}`;
    const worktree = path.join(cwd, "worktrees", app, runId);

    // Ensure worktrees parent directory exists
    fs.mkdirSync(path.dirname(worktree), { recursive: true });

    // Check if branch already exists (e.g. from a previous aborted run)
    if (await branchExists(pi, branchName)) {
      // Delete the stale branch first
      await pi.exec("git", ["branch", "-D", branchName]);
    }

    // Create the worktree with a new branch from current HEAD
    const addResult = await pi.exec("git", [
      "worktree",
      "add",
      "-b",
      branchName,
      worktree,
      "HEAD",
    ]);

    if (addResult.code !== 0) {
      throw new Error(
        `Failed to create git worktree: ${addResult.stderr || addResult.stdout}`,
      );
    }

    // Copy .env into the worktree so the agent can read env vars
    const envPath = path.join(cwd, ".env");
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, path.join(worktree, ".env"));
    }

    // Copy .env.example too
    const envExamplePath = path.join(cwd, ".env.example");
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, path.join(worktree, ".env.example"));
    }

    // Symlink node_modules to avoid a full install
    const nodeModulesSrc = path.join(cwd, "node_modules");
    const nodeModulesDst = path.join(worktree, "node_modules");
    if (fs.existsSync(nodeModulesSrc) && !fs.existsSync(nodeModulesDst)) {
      // Use a relative symlink for portability
      const relative = path.relative(worktree, nodeModulesSrc);
      try {
        fs.symlinkSync(relative, nodeModulesDst, "dir");
      } catch {
        // If symlink fails (e.g. on some Windows), fall back to copy via cp
        await pi.exec("cp", ["-a", nodeModulesSrc, nodeModulesDst]);
      }
    }

    return { worktree, branchName };
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  pi.registerCommand("pipeline-run", {
    description:
      "Run the E2E test pipeline for an app (pauses at gated steps 4 & 5). Each run creates its own git branch + worktree.",
    handler: async (args, ctx) => {
      const app = args.trim();
      if (!app) {
        ctx.ui.notify("Usage: /pipeline-run <app>", "error");
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
      ctx.ui.notify(`📋 Run ID: ${runId}`, "info");

      // Create isolated worktree
      let worktree: string;
      let branchName: string;
      try {
        const result = await setupWorktree(ctx.cwd, app, runId);
        worktree = result.worktree;
        branchName = result.branchName;
      } catch (err: any) {
        ctx.ui.notify(
          `Failed to create worktree: ${err.message}`,
          "error",
        );
        return;
      }

      ctx.ui.notify(
        `🌿 Branch: ${branchName}\n📂 Worktree: ${worktree}`,
        "info",
      );

      pipeline = {
        app,
        runId,
        currentStep: 0,
        status: "running",
        gateApprovals: { step4: false, step5: false },
        worktree,
      };
      persistState();

      ctx.ui.notify(
        `🚀 Pipeline started for "${app}" — step 1/8 (resolve)`,
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
          "No pipeline waiting at a gate. Use /pipeline-run <app> to start.",
          "warning",
        );
        return;
      }

      const step = pipeline.currentStep;

      // Determine which next step to dispatch after approval
      let nextDispatchStep: number;
      if (step === 4 && !pipeline.gateApprovals.step4) {
        pipeline.gateApprovals.step4 = true;
        // After step 4 approval, the agent promotes the page object to src/pages/.
        // Then dispatch step 5 (which is also gated).
        nextDispatchStep = 5;
      } else if (step === 5 && !pipeline.gateApprovals.step5) {
        pipeline.gateApprovals.step5 = true;
        // After step 5 approval, dispatch step 6 (non-gated; agent_end will chain).
        nextDispatchStep = 6;
      } else {
        ctx.ui.notify(
          `Gate step ${step} already approved. Use /pipeline-status.`,
          "info",
        );
        return;
      }

      persistState();

      // Instruct the agent that the human has approved the gated step.
      // The agent will promote artifacts (e.g. move page object to src/pages/)
      // and then go idle. agent_end will detect pendingGateApproval and
      // dispatch the next real step.
      pendingGateApproval = { nextDispatchStep };
      pi.sendUserMessage("approved");

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
          "No pipeline active. Use /pipeline-run <app> to start.",
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
        `Run ID:  ${pipeline.runId ?? "(pending — step 1 not yet complete)"}`,
        `Worktree: ${pipeline.worktree ?? "(none)"}`,
        `Status:  ${pipeline.status}`,
        `Progress:`,
        ...progressLines,
      ];

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  pi.registerCommand("pipeline-reset", {
    description: "Abort the current pipeline and remove its worktree",
    handler: async (_args, ctx) => {
      if (!pipeline) {
        ctx.ui.notify("No pipeline to reset.", "info");
        return;
      }

      const app = pipeline.app;
      const runId = pipeline.runId;
      const worktree = pipeline.worktree;
      const branchName = runId
        ? `pipeline/${app}/${runId}`
        : null;

      // Clean up worktree
      if (worktree && branchName) {
        ctx.ui.notify("🧹 Removing worktree and branch...", "info");
        await removeWorktree(pi, worktree, branchName);
      }

      pipeline = null;
      pendingPipelineStep = null;
      pendingGateApproval = null;
      pi.appendEntry("pipeline-state", null);

      ctx.ui.notify(`Pipeline for "${app}" reset. Worktree removed.`, "info");
    },
  });

  // ── Auto-advance on agent_end ─────────────────────────────────────────────

  pi.on("agent_end", async (_event, ctx) => {
    if (!pipeline) return;

    // ── Case 1: Gate approval just completed ─────────────────────────────
    if (pendingGateApproval) {
      const { nextDispatchStep } = pendingGateApproval;
      pendingGateApproval = null;

      // If the next step is ALSO gated, pause; otherwise auto-chain will handle it
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

    // If the pipeline was paused (gate was just sent), do NOT auto-advance.
    // The agent finished presenting the gated step draft and is now idle.
    // Wait for human /pipeline-continue (or manual "approved" message).
    if (pipeline.status === "paused_gate") {
      return;
    }

    // After step 1, verify the run ID from the worktree's results directory
    if (completedStep === 1 && pipeline.runId && pipeline.worktree) {
      const detectedRunId = findRunId(pipeline.app, pipeline.worktree);
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
            "Pipeline paused. Check the worktree and use /pipeline-run to restart.",
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
          `   Worktree: ${pipeline.worktree}\n` +
          `   Branch: pipeline/${pipeline.app}/${pipeline.runId}`,
        "success",
      );
      return;
    }

    // If next step is gated, warn the user before dispatching
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
              `   Worktree: ${pipeline.worktree ?? "(unknown — may be stale)"}`,
            "info",
          );
        }
        break;
      }
    }
  });
}
