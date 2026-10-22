import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { COST_LABEL, liveReportSchema, writeLiveReport } from "./live-report";

const STAMP = 42;

const REPORT = {
  schemaVersion: 1,
  suite: "workout-parser",
  provider: "anthropic",
  modelId: "claude-sonnet-5",
  cliVersion: "2.1.308",
  startedAt: "2026-10-22T10:00:00.000Z",
  repetitions: 2,
  callsMade: 5,
  calibrationInputTokens: 670,
  cost: { label: COST_LABEL, apiEquivalentUsd: 0.05 },
  stop: null,
  cases: [
    {
      id: "cycling-simple",
      runs: 2,
      passed: 1,
      failed: 1,
      unmeasured: 0,
      reasons: ["x"],
    },
  ],
};

describe("liveReportSchema", () => {
  it("should accept a report carrying only allowlisted keys", () => {
    // Arrange
    const report = REPORT;

    // Act
    const parsed = liveReportSchema.safeParse(report);

    // Assert
    expect(parsed.success).toBe(true);
  });

  it("should reject an unknown key at the root and inside a case", () => {
    // Arrange
    const atRoot = { ...REPORT, session_id: "abc" };
    const inCase = {
      ...REPORT,
      cases: [{ ...REPORT.cases[0], cwd: "/Users/x" }],
    };

    // Act
    const results = [atRoot, inCase].map((r) => liveReportSchema.safeParse(r));

    // Assert
    expect(results.map((r) => r.success)).toEqual([false, false]);
  });

  it("should label cost as API-equivalent and never as spend", () => {
    // Arrange
    const relabelled = {
      ...REPORT,
      cost: { label: "Cost", apiEquivalentUsd: 0.05 },
    };

    // Act
    const parsed = liveReportSchema.safeParse(relabelled);

    // Assert
    expect(COST_LABEL).toBe("API-equivalent cost (notional, not money spent)");
    expect(parsed.success).toBe(false);
  });
});

describe("writeLiveReport", () => {
  it("should write a validated eval-report-<ts>.json and refuse an invalid one", () => {
    // Arrange
    const dir = mkdtempSync(join(tmpdir(), "live-report-"));

    // Act
    const path = writeLiveReport(REPORT, dir, () => STAMP);
    const refused = () =>
      writeLiveReport({ ...REPORT, email: "a@b.c" }, dir, () => STAMP + 1);

    // Assert
    expect(path).toBe(join(dir, "eval-report-42.json"));
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(REPORT);
    expect(refused).toThrow();
    expect(readdirSync(dir)).toEqual(["eval-report-42.json"]);
    rmSync(dir, { recursive: true, force: true });
  });
});
