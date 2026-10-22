import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import { createClaudeCliLanguageModel } from "./claude-cli-language-model";
import { runLiveMain } from "./live-main";
import type { LiveMainDeps } from "./live-main";
import { createLiveSession } from "./live-session";
import type { WeeklyField } from "./rate-limit-guard";

const PINNED: WeeklyField = { path: ["utilization"], scale: "fraction" };
const LOW = 0.1;
const BUDGET = 2;
const MANAGED = "/Library/Application Support/ClaudeCode/managed-settings.json";

let root: string;

/** A loaded live model over a stub CLI; `calls()` counts model calls. */
const liveModel = (options: {
  field: WeeklyField | null;
  managed?: string;
}) => {
  let calls = 0;
  const session = createLiveSession({
    spawnClaude: async () => {
      calls++;
      return cliRun({}, [{ status: "allowed", utilization: LOW }]);
    },
    maxCalls: BUDGET,
    maxWeekly: 0.85,
    field: options.field,
  });
  const modelId = "claude-sonnet-5";
  const model = createClaudeCliLanguageModel({ modelId, call: session.call });
  const live = {
    model,
    modelId,
    provider: "anthropic" as const,
    session,
    managedSettingsFile: options.managed ?? null,
  };
  return { live, calls: () => calls };
};

const main = (argv: Array<string>, load: LiveMainDeps["load"]) => {
  const out: Array<string> = [];
  const deps: LiveMainDeps = {
    argv,
    load,
    log: (line) => out.push(line),
    error: (line) => out.push(`ERR ${line}`),
    reportDir: join(root, "reports"),
    calibrationDir: join(root, "calibration"),
    targets: {
      committedDir: join(root, "c"),
      iterationDir: join(root, "i"),
      servedForm: null,
    },
  };
  return runLiveMain(deps).then((outcome) => ({
    outcome,
    text: out.join("\n"),
  }));
};

describe("runLiveMain", () => {
  beforeEach(() => {
    vi.stubGlobal("AI_SDK_LOG_WARNINGS", false);
    root = mkdtempSync(join(tmpdir(), "live-main-"));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(root, { recursive: true, force: true });
  });

  it("should refuse a bad argument before loading anything", async () => {
    // Arrange
    const load = vi.fn();

    // Act
    const { outcome, text } = await main(["--repeat", "x"], load);

    // Assert
    expect(outcome).toBe("refused");
    expect(text).toContain("--repeat takes a positive integer");
    expect(load).not.toHaveBeenCalled();
  });

  it.each([
    [
      "an INERT detection",
      "INERT: claude CLI not available: CI is set",
      "refused",
    ],
    [
      "a model it cannot reach",
      "NOT MEASURED: EVAL_MODEL is not Anthropic",
      "ran",
    ],
  ])("should map %s to its outcome", async (_label, message, expected) => {
    // Arrange
    const load = () => Promise.reject(new Error(message));

    // Act
    const { outcome } = await main([], load);

    // Assert
    expect(outcome).toBe(expected);
  });

  it("should make one call for --calibrate and write the capture", async () => {
    // Arrange
    const { live, calls } = liveModel({ field: null, managed: MANAGED });

    // Act
    const { outcome, text } = await main(["--calibrate"], async () => live);

    // Assert
    expect(outcome).toBe("ran");
    expect(calls()).toBe(1);
    expect(text).toContain(`managed-settings file exists at ${MANAGED}`);
    expect(readdirSync(join(root, "calibration"))).toHaveLength(1);
  });

  it("should map an unpinned guard's stop to a fault and a budget stop to ran", async () => {
    // Arrange
    const unpinned = liveModel({ field: null });
    const pinned = liveModel({ field: PINNED });

    // Act
    const faulted = await main([], async () => unpinned.live);
    const budgeted = await main([], async () => pinned.live);

    // Assert
    expect(faulted.outcome).toBe("fault");
    expect(budgeted.outcome).toBe("ran");
    expect(budgeted.text).toContain("Pass stopped (budget)");
    expect(readdirSync(join(root, "reports"))).toHaveLength(2);
  });

  it("should refuse --record of the official model before any call while the form is unpinned", async () => {
    // Arrange
    const { live, calls } = liveModel({ field: PINNED });

    // Act
    const { outcome, text } = await main(["--record"], async () => live);

    // Assert
    expect(outcome).toBe("refused");
    expect(text).toContain("OFFICIAL_SERVED_FORM is not pinned");
    expect(calls()).toBe(0);
  });
});
