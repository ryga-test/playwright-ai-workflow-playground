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
  stepMarkerReceived: boolean; // Phase 2: true when CompletionWatcher fired for currentStep
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

// ── CompletionWatcher (Phase 1 foundation) ───────────────────────────────────

interface WatchContext {
  runId: string;
  app: string;
  flowId: string;
}

interface WatchRequest {
  artifactPath: string;
  step: number;
  context: WatchContext;
  pollIntervalMs?: number;
}

/**
 * CompletionWatcher polls the primary artifact file for the explicit
 * @step-complete marker. Uses last-N-bytes read for efficiency.
 * Enforces single-watch invariant and destroyed flag for safe reset.
 */
class CompletionWatcher {
  private currentWatch: WatchRequest | null = null;
  private interval: NodeJS.Timeout | null = null;
  private destroyed = false;
  private readonly defaultPollIntervalMs = 500;

  /**
   * Callback fired when a valid marker for the watched step is detected.
   * Set by runner after construction.
   */
  onComplete: ((step: number, context: WatchContext) => void) | null = null;

  /**
   * Start watching the given artifact. Replaces any prior watch (unwatch first).
   * Poll interval from req or default (will be manifest-driven later).
   */
  watch(req: WatchRequest): void {
    if (this.destroyed) return;
    this.unwatch(); // enforce single-watch invariant

    this.currentWatch = { ...req };
    const intervalMs = req.pollIntervalMs ?? this.defaultPollIntervalMs;

    // Start polling; first check happens after first interval.
    // (Immediate check could be added if needed for restore cases.)
    this.interval = setInterval(() => this.poll(), intervalMs);
  }

  /** Stop polling and clear current watch. Idempotent. */
  unwatch(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.currentWatch = null;
  }

  /** Hard destroy: set flag, stop interval, clear callback. Called on /pipeline-reset. */
  destroy(): void {
    this.destroyed = true;
    this.unwatch();
    this.onComplete = null;
  }

  private poll(): void {
    if (this.destroyed || !this.currentWatch || !this.onComplete) {
      return;
    }

    const { artifactPath, step, context } = this.currentWatch;

    try {
      if (!fs.existsSync(artifactPath)) {
        return; // keep polling for file creation
      }

      const stats = fs.statSync(artifactPath);
      if (stats.size === 0) return;

      const readSize = Math.min(512, stats.size);
      const fd = fs.openSync(artifactPath, "r");
      const buffer = Buffer.alloc(readSize);
      fs.readSync(fd, buffer, 0, readSize, stats.size - readSize);
      fs.closeSync(fd);

      const tail = buffer.toString("utf8");

      // Robust detection: search tail for marker for *this* step (anywhere in last 512 bytes).
      // Tolerates trailing newlines, extra text after marker, or non-last-line placement.
      // Matches manifest regex style; ignores comment prefix.
      const markerRegex = new RegExp(`@step-complete step=${step} runId=([\\w-]+T[\\w:]+Z?)`);
      const match = tail.match(markerRegex);
      if (match) {
        const markerRunId = match[1];
        // Detected — fire and let handler decide whether to unwatch
        const cb = this.onComplete;
        if (cb) cb(step, context);
      }
    } catch (err) {
      // Transient FS errors (e.g. during write) — keep polling
      // console.debug("[CompletionWatcher] poll error (ignored):", err);
    }
  }
}

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

/**
 * Phase 1: Step-to-primary-artifact path resolver.
 * Returns absolute path to the designated primary artifact for the step.
 * Uses explicit mapping (will be manifest-driven after Task 2).
 * Templates use actual values, not placeholders.
 */
function getPrimaryArtifactPath(
  step: number,
  app: string,
  flowId: string,
  runId: string,
  cwd: string
): string {
  const relTemplates: Record<number, string> = {
    1: `results/${app}/flows/${flowId}/${runId}/step1-resolve/run-metadata.json`,
    2: `results/${app}/flows/${flowId}/${runId}/step2-discover/snapshot.yaml`,
    3: `results/${app}/flows/${flowId}/${runId}/step3-extract-selectors/normalized-selectors.md`,
    4: `results/${app}/flows/${flowId}/${runId}/step4-draft-page-object/page-object.draft.ts`,
    5: `results/${app}/flows/${flowId}/${runId}/step5-draft-tests/test-drafts-index.md`,
    6: `results/${app}/flows/${flowId}/${runId}/flow-summary.md`,
    7: `results/${app}/flows/${flowId}/${runId}/step7-run-fix/test-report.md`,
    8: `results/${app}/flows/${flowId}/${runId}/pipeline-summary.md`,
  };
  const rel = relTemplates[step] ?? `results/${app}/flows/${flowId}/${runId}/step${step}/primary.md`;
  return path.join(cwd, rel);
}

// ── Extension ────────────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  let pipeline: PipelineState | null = null;

  // Phase 2: CompletionWatcher instance (created once per extension load)
  let watcher: CompletionWatcher;

  // ── Persistence ──────────────────────────────────────────────────────────

  function persistState() {
    if (pipeline) {
      pi.appendEntry("pipeline-state", pipeline);
    }
  }

  // Initialize watcher and wire onComplete (Phase 2)
  watcher = new CompletionWatcher();
  watcher.onComplete = onStepComplete;

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

  // ── Completion state machine (Phase 2) ─────────────────────────────────────

  /**
   * onStepComplete: called by CompletionWatcher when marker detected.
   * Implements exact state machine from PRD.
   */
  function onStepComplete(step: number, context: WatchContext) {
    if (!pipeline || !watcher) {
      if (watcher) watcher.unwatch();
      return;
    }

    // 1. Stale watcher check
    if (step !== pipeline.currentStep) {
      console.warn(`[Pipeline] Ignoring stale marker for step ${step} (currentStep=${pipeline.currentStep})`);
      return;
    }

    // 2. Step 1 runId verification
    if (step === 1 && pipeline.runId) {
      // Use process.cwd() fallback; in practice ctx.cwd from dispatch context
      const detectedRunId = findRunId(pipeline.app, pipeline.flowId, process.cwd());
      if (detectedRunId) {
        if (detectedRunId !== pipeline.runId) {
          // Note: no ctx.ui here; in full use queued notify or accept
          console.info(`[Pipeline] Run ID verified: ${detectedRunId}`);
          if (pipeline.runId !== detectedRunId) {
            pipeline.runId = detectedRunId;
          }
        }
        persistState();
      }
    }

    // 3. Mark received
    pipeline.stepMarkerReceived = true;
    persistState();

    // Gate decision: pause for approval ONLY after a gated step (4 or 5) completes.
    // Non-gated steps auto-advance. Gated steps are dispatched normally (to produce drafts)
    // but cause pause AFTER completion so human can approve before next.
    if (GATED_STEPS.has(step)) {
      pipeline.status = "paused_gate";
      persistState();
      watcher.unwatch();
      console.log(`[Pipeline] GATED after step ${step} — use /pipeline-continue to approve`);
      return;
    }

    // Non-gated step completed: auto-advance
    const nextStep = step + 1;
    if (nextStep > TOTAL_STEPS) {
      pipeline.status = "complete";
      persistState();
      watcher.unwatch();
      // Notify would use ctx in real handler; console for Phase 2
      console.log(`[Pipeline] COMPLETE: all steps done for ${pipeline.app}/${pipeline.flowId}/${pipeline.runId}`);
      return;
    }

    pipeline.currentStep = nextStep;
    pipeline.stepMarkerReceived = false;
    persistState();
    watcher.unwatch();
    const artifactPath = getPrimaryArtifactPath(
      nextStep,
      pipeline.app,
      pipeline.flowId,
      pipeline.runId!,
      process.cwd()
    );
    watcher.watch({ artifactPath, step: nextStep, context: { runId: pipeline.runId!, app: pipeline.app, flowId: pipeline.flowId } });
    dispatchStep(nextStep);
  }

  // ── Step dispatch (refactored Phase 2) ─────────────────────────────────────

  /**
   * Send a pipeline step prompt as a user message to the agent.
   * Always uses followUp, injects completion marker instruction + self-check,
   * registers CompletionWatcher for primary artifact.
   */
  function dispatchStep(step: number, ctx?: any) {
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

    // Phase 2: inject explicit completion marker instruction + self-check (format-aware footer)
    const markerInstruction =
      `\n\n---\n**COMPLETION SIGNALING (MANDATORY):** Before finishing, verify the PRIMARY ARTIFACT contains this marker (use the correct format for the file type):\n\n  <!-- @step-complete step=${step} runId=${runId} -->   (Markdown / Gherkin — last line)\n  // @step-complete step=${step} runId=${runId}         (TypeScript / JS — last line)\n  # @step-complete step=${step} runId=${runId}          (YAML — last line)\n  "_stepComplete": "@step-complete step=${step} runId=${runId}"  (JSON — last key before closing })\n\nIf the marker is not present, add it now. For JSON, add it as the final top-level key. For all other formats, append as the final line. Self-check before you stop.`;
    message = message + markerInstruction;

    pipeline.currentStep = step;
    pipeline.stepMarkerReceived = false;
    pipeline.status = "running";
    persistState();

    // Always followUp (idle-guard removed in Phase 2)
    pi.sendUserMessage(message, { streamingBehavior: "followUp" });

    // Register watcher for primary artifact (push model from manifest primary_output)
    const cwd = (ctx && ctx.cwd) || process.cwd();
    const artifactPath = getPrimaryArtifactPath(step, app, pipeline.flowId, runId, cwd);
    watcher.watch({
      artifactPath,
      step,
      context: { runId, app, flowId: pipeline.flowId },
    });
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
        stepMarkerReceived: false,
      };
      persistState();

      ctx.ui.notify(
        `🚀 Pipeline started for "${app}" flow "${flowId}" — step 1/8 (resolve)`,
        "info",
      );
      dispatchStep(1, ctx);
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

      // Phase 2/3: send approved (side-effect for promotion), then IMMEDIATELY advance
      // Send approved (promotion side-effect); advance immediately via watcher
      pi.sendUserMessage("approved", { streamingBehavior: "followUp" });

      // Advance: always dispatch next (may be gated or not). If gated, onStepComplete will pause after it finishes.
      // This ensures gated steps 4/5 execute to produce drafts, then pause only after their completion.
      pipeline.currentStep = nextDispatchStep;
      pipeline.stepMarkerReceived = false;
      pipeline.status = "running";
      watcher.unwatch();
      const cwd = ctx.cwd || process.cwd();
      const artifactPath = getPrimaryArtifactPath(
        nextDispatchStep,
        pipeline.app,
        pipeline.flowId,
        pipeline.runId!,
        cwd
      );
      watcher.watch({ artifactPath, step: nextDispatchStep, context: { runId: pipeline.runId!, app: pipeline.app, flowId: pipeline.flowId } });
      dispatchStep(nextDispatchStep, ctx);
      persistState();

      ctx.ui.notify(
        `✅ Sent approval for step ${step}/8. Advancing to step ${nextDispatchStep}/8...`,
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

      const markerStatus = (n: number) => {
        if (n !== pipeline!.currentStep) return "";
        if (pipeline!.stepMarkerReceived) return " [marker received]";
        return " [agent working]";
      };

      const progressLines = Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const n = i + 1;
        const done =
          n < pipeline!.currentStep ||
          (n === pipeline!.currentStep &&
            pipeline!.status === "complete");
        const marker = done ? "✓" : stepPad(n);
        const mStatus = markerStatus(n);
        return `  ${marker} ${n}/8 ${STEP_NAMES[n]}${gateStatus(n)}${mStatus}`;
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
      watcher.destroy();
      pi.appendEntry("pipeline-state", null);

      ctx.ui.notify(`Pipeline for "${app}" reset.`, "info");
    },
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
          if (typeof pipeline.stepMarkerReceived !== "boolean") {
            pipeline.stepMarkerReceived = false;
          }

          const cwd = ctx.cwd || process.cwd();
          let shouldReset = false;

          if (pipeline.status === "running" && pipeline.currentStep > 0 && pipeline.runId) {
            const artifactPath = getPrimaryArtifactPath(
              pipeline.currentStep,
              pipeline.app,
              pipeline.flowId,
              pipeline.runId,
              cwd
            );
            if (fs.existsSync(artifactPath)) {
              // Artifact exists: attach watcher (fires immediately if marker already present)
              watcher.watch({ artifactPath, step: pipeline.currentStep, context: { runId: pipeline.runId, app: pipeline.app, flowId: pipeline.flowId } });
            } else {
              // Missing artifact = unrecoverable, reset
              shouldReset = true;
            }
          } else if (pipeline.status === "paused_gate") {
            // Just notify, no watcher per PRD
          }

          if (shouldReset) {
            ctx.ui.notify(
              `⚠️ Restored pipeline for "${pipeline.app}" but primary artifact for step ${pipeline.currentStep} missing. Resetting pipeline state.`,
              "warning",
            );
            pipeline = null;
            watcher.destroy();
            pi.appendEntry("pipeline-state", null);
            break;
          }

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

