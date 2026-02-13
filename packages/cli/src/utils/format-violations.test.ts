import type { ToleranceViolation, ValidationError } from "@kaiord/core";
import stripAnsi from "strip-ansi";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatToleranceViolations,
  formatValidationErrors,
} from "./format-violations";

vi.mock("./is-tty", () => ({
  isTTY: vi.fn(() => false),
}));

describe("formatValidationErrors", () => {
  afterEach(() => {
    delete process.env.FORCE_COLOR;
  });

  it("should return empty string for empty errors array", () => {
    const errors: Array<ValidationError> = [];

    const result = formatValidationErrors(errors);

    expect(result).toBe("");
  });

  it("should format a single validation error", () => {
    const errors: Array<ValidationError> = [
      { field: "version", message: "Required field missing" },
    ];

    const result = formatValidationErrors(errors);
    const stripped = stripAnsi(result);

    expect(stripped).toContain("Validation errors:");
    expect(stripped).toContain("version: Required field missing");
  });

  it("should format multiple validation errors", () => {
    const errors: Array<ValidationError> = [
      { field: "version", message: "Required field missing" },
      { field: "type", message: "Invalid value" },
    ];

    const result = formatValidationErrors(errors);
    const stripped = stripAnsi(result);

    expect(stripped).toContain("Validation errors:");
    expect(stripped).toContain("version: Required field missing");
    expect(stripped).toContain("type: Invalid value");
  });

  it("should include bullet points", () => {
    const errors: Array<ValidationError> = [
      { field: "version", message: "Required" },
    ];

    const result = formatValidationErrors(errors);
    const stripped = stripAnsi(result);

    expect(stripped).toContain("\u2022");
  });

  it("should still contain correct content when FORCE_COLOR is set", () => {
    process.env.FORCE_COLOR = "1";
    const errors: Array<ValidationError> = [
      { field: "test", message: "error" },
    ];

    const result = formatValidationErrors(errors);
    const stripped = stripAnsi(result);

    // Content is correct regardless of color support
    expect(stripped).toContain("Validation errors:");
    expect(stripped).toContain("test: error");
  });

  it("should produce plain output when not in TTY and no FORCE_COLOR", () => {
    const errors: Array<ValidationError> = [
      { field: "field1", message: "msg1" },
    ];

    const result = formatValidationErrors(errors);

    // Without TTY or FORCE_COLOR, shouldUseColors returns false
    // so chalk wrapping is skipped and output is plain text
    expect(result).toContain("Validation errors:");
    expect(result).toContain("field1: msg1");
  });
});

describe("formatToleranceViolations", () => {
  afterEach(() => {
    delete process.env.FORCE_COLOR;
  });

  it("should return empty string for empty violations array", () => {
    const violations: Array<ToleranceViolation> = [];

    const result = formatToleranceViolations(violations);

    expect(result).toBe("");
  });

  it("should format a single violation", () => {
    const violations: Array<ToleranceViolation> = [
      {
        field: "steps[0].duration.seconds",
        expected: 300,
        actual: 301,
        deviation: 1,
        tolerance: 1,
      },
    ];

    const result = formatToleranceViolations(violations);
    const stripped = stripAnsi(result);

    expect(stripped).toContain("Tolerance violations:");
    expect(stripped).toContain("steps[0].duration.seconds");
    expect(stripped).toContain("expected 300, got 301");
    expect(stripped).toContain("deviation: 1, tolerance: \u00B11");
  });

  it("should format multiple violations", () => {
    const violations: Array<ToleranceViolation> = [
      {
        field: "power",
        expected: 250,
        actual: 252,
        deviation: 2,
        tolerance: 1,
      },
      {
        field: "heartRate",
        expected: 150,
        actual: 148,
        deviation: -2,
        tolerance: 1,
      },
    ];

    const result = formatToleranceViolations(violations);
    const stripped = stripAnsi(result);

    expect(stripped).toContain("power");
    expect(stripped).toContain("heartRate");
  });

  it("should show absolute deviation for negative deviations", () => {
    const violations: Array<ToleranceViolation> = [
      {
        field: "power",
        expected: 250,
        actual: 248,
        deviation: -2,
        tolerance: 1,
      },
    ];

    const result = formatToleranceViolations(violations);
    const stripped = stripAnsi(result);

    expect(stripped).toContain("deviation: 2");
  });

  it("should still contain correct content when FORCE_COLOR is set", () => {
    process.env.FORCE_COLOR = "1";
    const violations: Array<ToleranceViolation> = [
      {
        field: "power",
        expected: 250,
        actual: 252,
        deviation: 2,
        tolerance: 1,
      },
    ];

    const result = formatToleranceViolations(violations);
    const stripped = stripAnsi(result);

    // Content is correct regardless of color support
    expect(stripped).toContain("Tolerance violations:");
    expect(stripped).toContain("power");
    expect(stripped).toContain("expected 250, got 252");
  });

  it("should produce plain output when not in TTY and no FORCE_COLOR", () => {
    const violations: Array<ToleranceViolation> = [
      {
        field: "hr",
        expected: 150,
        actual: 152,
        deviation: 2,
        tolerance: 1,
      },
    ];

    const result = formatToleranceViolations(violations);

    expect(result).toContain("Tolerance violations:");
    expect(result).toContain("hr");
    expect(result).toContain("expected 150, got 152");
  });
});
