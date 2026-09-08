import { describe, it, expect } from "vitest";
import { dimensionRatePercent } from "./dimension-outcomes";
import { createReport, formatReport } from "./reporter";
import type { EvalResult } from "./types";
import {
  PASS_RATE_FIFTY,
  PASS_RATE_TWO_THIRDS,
  PASS_RATE_TWO_THIRDS_PRECISION,
  PASS_RATE_TWO_THIRDS_ROUNDED,
} from "../test-utils/constants";

const passingResult: EvalResult = {
  id: "cycling-en-001",
  pass: true,
  errors: [],
  sport: "cycling",
  stepCount: 5,
  durationMs: 1200,
};

const failingResult: EvalResult = {
  id: "running-es-002",
  pass: false,
  errors: ["Sport mismatch: expected running, got cycling"],
  sport: "cycling",
  stepCount: 3,
  durationMs: 800,
};

describe("createReport", () => {
  it("should calculate pass rate and totals", () => {
    // Arrange
    const results = [passingResult, failingResult];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.provider).toBe("openai");
    expect(report.model).toBe("gpt-4");
    expect(report.total).toBe(2);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.passRatePercent).toBe(PASS_RATE_FIFTY);
    expect(report.results).toStrictEqual(results);
  });

  it.each([
    {
      label: "100% when all pass",
      results: [passingResult, { ...passingResult, id: "cycling-en-002" }],
      rate: 100,
      failed: 0,
    },
    { label: "0% when all fail", results: [failingResult], rate: 0, failed: 1 },
  ])("should compute $label", ({ results, rate, failed }) => {
    // Arrange

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.passRatePercent).toBe(rate);
    expect(report.failed).toBe(failed);
  });

  it("should store the rate unrounded, so display cannot move a comparison", () => {
    // Arrange
    const results = [
      passingResult,
      { ...passingResult, id: "cycling-en-002" },
      failingResult,
    ];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.passRatePercent).toBeCloseTo(
      PASS_RATE_TWO_THIRDS,
      PASS_RATE_TWO_THIRDS_PRECISION
    );
    expect(report.passRatePercent).not.toBe(PASS_RATE_TWO_THIRDS_ROUNDED);
  });

  it("should round only for display", () => {
    // Arrange
    const results = [
      passingResult,
      { ...passingResult, id: "cycling-en-002" },
      failingResult,
    ];

    // Act
    const text = formatReport(createReport(results, "openai", "gpt-4"));

    // Assert
    expect(text).toContain(`Pass rate: ${PASS_RATE_TWO_THIRDS_ROUNDED}% (2/3)`);
  });

  it("should group by category from id prefix", () => {
    // Arrange
    const results = [passingResult, failingResult];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.byCategory).toStrictEqual({
      cycling: { total: 1, passed: 1 },
      running: { total: 1, passed: 0 },
    });
  });

  it("should group by language from id second segment", () => {
    // Arrange
    const results = [passingResult, failingResult];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.byLanguage).toStrictEqual({
      en: { total: 1, passed: 1 },
      es: { total: 1, passed: 0 },
    });
  });

  it("should include ISO timestamp", () => {
    // Arrange

    // Act
    const report = createReport([passingResult], "openai", "gpt-4");

    // Assert
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("formatReport", () => {
  it("should format report as markdown-like text", () => {
    // Arrange
    const report = createReport(
      [passingResult, failingResult],
      "openai",
      "gpt-4"
    );

    // Act
    const output = formatReport(report);

    // Assert
    expect(output).toContain("# Eval Report: openai / gpt-4");
    expect(output).toContain("Pass rate: 50% (1/2)");
    expect(output).toContain("[PASS] cycling-en-001");
    expect(output).toContain("[FAIL] running-es-002");
    expect(output).toContain("Sport mismatch: expected running, got cycling");
    expect(output).toContain("## By Category");
    expect(output).toContain("cycling: 1/1");
    expect(output).toContain("running: 0/1");
  });

  it("should include duration in milliseconds for each result", () => {
    // Arrange
    const report = createReport([passingResult], "anthropic", "claude");

    // Act
    const output = formatReport(report);

    // Assert
    expect(output).toContain("(1200ms)");
  });

  it("should indent error messages under failing results", () => {
    // Arrange
    const report = createReport([failingResult], "openai", "gpt-4");
    const output = formatReport(report);
    const lines = output.split("\n");

    // Act
    const errorLine = lines.find((l) => l.includes("Sport mismatch"));

    // Assert
    expect(errorLine).toMatch(/^\s{4}/);
  });
});

describe("createReport — dimension tallies", () => {
  const withOutcomes = (
    id: string,
    pass: boolean,
    outcomes: EvalResult["outcomes"]
  ): EvalResult => ({ id, pass, errors: [], durationMs: 1, outcomes });

  it("should report measured and passed as a pair", () => {
    // Arrange
    const results = [
      withOutcomes("cycling-en-1", true, [
        { dimension: "steps", status: "passed" },
      ]),
      withOutcomes("cycling-en-2", false, [
        { dimension: "steps", status: "failed", message: "Too few steps" },
      ]),
    ];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.byDimension?.steps).toMatchObject({
      measured: 2,
      passed: 1,
      unmeasured: 0,
    });
  });

  it("should exclude an unmeasured criterion from its dimension's rate", () => {
    // Arrange
    const results = [
      withOutcomes("cycling-en-1", true, [
        { dimension: "zone", status: "passed" },
      ]),
      withOutcomes("cycling-en-2", true, [
        { dimension: "zone", status: "unmeasured", reason: "no zoneCheck" },
      ]),
    ];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.byDimension?.zone).toMatchObject({
      measured: 1,
      passed: 1,
      unmeasured: 1,
    });
    expect(dimensionRatePercent(report.byDimension!.zone!)).toBe(100);
  });

  it("should have NO rate for a dimension nothing measured", () => {
    // Arrange
    const results = [
      withOutcomes("cycling-en-1", true, [
        { dimension: "zone", status: "unmeasured", reason: "no zoneCheck" },
      ]),
    ];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(dimensionRatePercent(report.byDimension!.zone!)).toBeNull();
  });

  it("should carry the reason an unmeasured dimension was skipped", () => {
    // Arrange
    const results = [
      withOutcomes("cycling-en-1", true, [
        {
          dimension: "sport",
          status: "unmeasured",
          reason: "benchmark declares no expectedSport",
        },
      ]),
    ];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.byDimension?.sport?.reasons).toEqual([
      "benchmark declares no expectedSport",
    ]);
  });

  it("should omit the dimension section for results that carry no outcomes", () => {
    // Arrange
    const results = [passingResult];

    // Act
    const report = createReport(results, "openai", "gpt-4");

    // Assert
    expect(report.byDimension).toBeUndefined();
  });

  it("should print a not-measured dimension as such, never as a percentage", () => {
    // Arrange
    const results = [
      withOutcomes("cycling-en-1", true, [
        { dimension: "zone", status: "unmeasured", reason: "no zoneCheck" },
      ]),
    ];

    // Act
    const text = formatReport(createReport(results, "openai", "gpt-4"));

    // Assert
    expect(text).toContain("zone: not measured");
    expect(text).not.toContain("zone: 0/0");
  });
});
