import { describe, expect, it } from "vitest";

import { cliRun } from "../../test-utils/claude-cli-doubles";
import type { Calibration } from "./calibration-call";
import { createLiveSession } from "./live-session";
import type { StopState } from "./live-session";
import { buildLiveReport, formatLiveSummary, scrubHome } from "./live-summary";

const HOME = "/Users/someone";
const CALIBRATION: Calibration = { ok: true, run: cliRun(), overheadTokens: 0 };

const reportStoppedBy = (stop: StopState, tally: { passed: number }) => {
  const session = createLiveSession({
    spawnClaude: async () => cliRun(),
    maxCalls: 1,
    maxWeekly: 0.85,
    field: null,
  });
  session.halt(stop);
  return buildLiveReport({
    suite: "workout-parser",
    modelId: "claude-sonnet-5",
    startedAt: new Date("2026-10-22T10:00:00.000Z"),
    repetitions: 1,
    session,
    calibration: CALIBRATION,
    home: HOME,
    tallies: [
      {
        id: "cycling-simple",
        runs: 1,
        passed: tally.passed,
        failed: 0,
        unmeasured: 1 - tally.passed,
        reasons: [`ENOENT: ${HOME}/x/y.json`],
      },
    ],
  });
};

describe("live summary stops", () => {
  it("should replace the home directory with ~ in every reason", () => {
    // Arrange
    const stop: StopState = {
      kind: "harness-fault",
      reason: `EACCES ${HOME}/a`,
    };

    // Act
    const report = reportStoppedBy(stop, { passed: 0 });

    // Assert
    expect(JSON.stringify(report)).not.toContain(HOME);
    expect(report.stop?.reason).toBe("EACCES ~/a");
    expect(report.cases[0]?.reasons).toEqual(["ENOENT: ~/x/y.json"]);
  });

  it.each(["budget", "rate-limit"] as const)(
    "should say no case was measured when the %s stopped the pass first",
    (kind) => {
      // Arrange
      const stop: StopState = { kind, reason: "limit" };

      // Act
      const text = formatLiveSummary(reportStoppedBy(stop, { passed: 0 }));

      // Assert
      expect(text).toContain(
        `No case was measured: the pass stopped on its ${kind}`
      );
    }
  );

  it("should not say so once a case was measured", () => {
    // Arrange
    const stop: StopState = { kind: "budget", reason: "limit" };

    // Act
    const text = formatLiveSummary(reportStoppedBy(stop, { passed: 1 }));

    // Assert
    expect(text).not.toContain("No case was measured");
  });

  it("should leave text alone when the home is the root", () => {
    // Arrange
    const text = "/a/b";

    // Act
    const scrubbed = scrubHome(text, "/");

    // Assert
    expect(scrubbed).toBe(text);
  });
});
