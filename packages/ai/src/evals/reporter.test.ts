import { describe, it, expect } from "vitest";
import { createReport, formatReport } from "./reporter";
import type { EvalResult } from "./types";

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
    const results = [passingResult, failingResult];

    const report = createReport(results, "openai", "gpt-4");

    expect(report.provider).toBe("openai");
    expect(report.model).toBe("gpt-4");
    expect(report.total).toBe(2);
    expect(report.passed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.passRate).toBe(50);
    expect(report.results).toStrictEqual(results);
  });

  it("should compute 100% pass rate when all pass", () => {
    const results = [passingResult, { ...passingResult, id: "cycling-en-002" }];

    const report = createReport(results, "anthropic", "claude");

    expect(report.passRate).toBe(100);
    expect(report.failed).toBe(0);
  });

  it("should compute 0% pass rate when all fail", () => {
    const results = [failingResult];

    const report = createReport(results, "openai", "gpt-4");

    expect(report.passRate).toBe(0);
  });

  it("should group by category from id prefix", () => {
    const results = [passingResult, failingResult];

    const report = createReport(results, "openai", "gpt-4");

    expect(report.byCategory).toStrictEqual({
      cycling: { total: 1, passed: 1 },
      running: { total: 1, passed: 0 },
    });
  });

  it("should group by language from id second segment", () => {
    const results = [passingResult, failingResult];

    const report = createReport(results, "openai", "gpt-4");

    expect(report.byLanguage).toStrictEqual({
      en: { total: 1, passed: 1 },
      es: { total: 1, passed: 0 },
    });
  });

  it("should include ISO timestamp", () => {
    const report = createReport([passingResult], "openai", "gpt-4");

    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("formatReport", () => {
  it("should format report as markdown-like text", () => {
    const report = createReport(
      [passingResult, failingResult],
      "openai",
      "gpt-4"
    );

    const output = formatReport(report);

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
    const report = createReport([passingResult], "anthropic", "claude");

    const output = formatReport(report);

    expect(output).toContain("(1200ms)");
  });

  it("should indent error messages under failing results", () => {
    const report = createReport([failingResult], "openai", "gpt-4");

    const output = formatReport(report);
    const lines = output.split("\n");
    const errorLine = lines.find((l) => l.includes("Sport mismatch"));

    expect(errorLine).toMatch(/^\s{4}/);
  });
});
