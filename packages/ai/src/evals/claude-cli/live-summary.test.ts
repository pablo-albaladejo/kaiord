import { describe, expect, it } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import type { Calibration } from "./calibration-call";
import { COST_LABEL } from "./live-report";
import { createLiveSession } from "./live-session";
import { buildLiveReport, formatLiveSummary } from "./live-summary";

const session = createLiveSession({
  spawnClaude: async () => cliRun(),
  maxCalls: 1,
  maxWeekly: 0.85,
  field: null,
});

const input = (calibration: Calibration) => ({
  suite: "workout-parser",
  modelId: "claude-sonnet-5",
  startedAt: new Date("2026-10-22T10:00:00.000Z"),
  repetitions: 3,
  session,
  calibration,
  tallies: [
    {
      id: "cycling-simple",
      runs: 3,
      passed: 2,
      failed: 1,
      unmeasured: 0,
      reasons: ["schema: bad"],
    },
  ],
});

describe("buildLiveReport", () => {
  it("should report counts, the stop and the API-equivalent cost", async () => {
    // Arrange
    await session.call({
      modelId: "claude-sonnet-5",
      system: "s",
      prompt: "p",
    });
    const calibration: Calibration = {
      ok: true,
      run: cliRun(),
      overheadTokens: 670,
    };

    // Act
    const report = buildLiveReport(input(calibration));
    const text = formatLiveSummary(report);

    // Assert
    expect(report).toMatchObject({
      cliVersion: "2.1.308",
      callsMade: 1,
      calibrationInputTokens: 670,
      cost: { label: COST_LABEL, apiEquivalentUsd: 0.01 },
      stop: { kind: "harness-fault" },
    });
    expect(text).toContain(
      "cycling-simple: 2/3 passed, 1 failed, 0 unmeasured"
    );
    expect(text).toContain(`${COST_LABEL}: $0.0100`);
    expect(text).toContain("Pass stopped (harness-fault)");
    expect(text).not.toMatch(/%/);
  });

  it("should leave the CLI version and overhead empty when calibration failed", () => {
    // Arrange
    const calibration: Calibration = {
      ok: false,
      stop: { kind: "context-leak", reason: "x" },
    };

    // Act
    const report = buildLiveReport(input(calibration));

    // Assert
    expect(report.cliVersion).toBeNull();
    expect(report.calibrationInputTokens).toBeNull();
  });
});
