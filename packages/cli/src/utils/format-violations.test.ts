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
    // Arrange
    const errors: Array<ValidationError> = [];

    // Act
    const result = formatValidationErrors(errors);

    // Assert
    expect(result).toBe("");
  });

  it("should format a single validation error", () => {
    // Arrange
    const errors: Array<ValidationError> = [
      { field: "version", message: "Required field missing" },
    ];

    // Act
    const stripped = stripAnsi(formatValidationErrors(errors));

    // Assert
    expect(stripped).toContain("Validation errors:");
    expect(stripped).toContain("version: Required field missing");
  });

  it("should format multiple validation errors", () => {
    // Arrange
    const errors: Array<ValidationError> = [
      { field: "version", message: "Required field missing" },
      { field: "type", message: "Invalid value" },
    ];

    // Act
    const stripped = stripAnsi(formatValidationErrors(errors));

    // Assert
    expect(stripped).toContain("Validation errors:");
    expect(stripped).toContain("version: Required field missing");
    expect(stripped).toContain("type: Invalid value");
  });

  it("should include bullet points", () => {
    // Arrange
    const errors: Array<ValidationError> = [
      { field: "version", message: "Required" },
    ];

    // Act
    const stripped = stripAnsi(formatValidationErrors(errors));

    // Assert
    expect(stripped).toContain("\u2022");
  });

  it("should still contain correct content when FORCE_COLOR is set", () => {
    // Arrange
    process.env.FORCE_COLOR = "1";
    const errors: Array<ValidationError> = [
      { field: "test", message: "error" },
    ];

    // Act
    const stripped = stripAnsi(formatValidationErrors(errors));

    // Assert
    expect(stripped).toContain("Validation errors:");
    expect(stripped).toContain("test: error");
  });
});

describe("formatToleranceViolations", () => {
  afterEach(() => {
    delete process.env.FORCE_COLOR;
  });

  it("should return empty string for empty violations array", () => {
    // Arrange
    const violations: Array<ToleranceViolation> = [];

    // Act
    const result = formatToleranceViolations(violations);

    // Assert
    expect(result).toBe("");
  });

  it("should format a single violation", () => {
    // Arrange
    const violations: Array<ToleranceViolation> = [
      {
        field: "steps[0].duration.seconds",
        expected: 300,
        actual: 301,
        deviation: 1,
        tolerance: 1,
      },
    ];

    // Act
    const stripped = stripAnsi(formatToleranceViolations(violations));

    // Assert
    expect(stripped).toContain("Tolerance violations:");
    expect(stripped).toContain("steps[0].duration.seconds");
    expect(stripped).toContain("expected 300, got 301");
    expect(stripped).toContain("deviation: 1, tolerance: \u00B11");
  });

  it("should format multiple violations", () => {
    // Arrange
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

    // Act
    const stripped = stripAnsi(formatToleranceViolations(violations));

    // Assert
    expect(stripped).toContain("power");
    expect(stripped).toContain("heartRate");
  });

  it("should show absolute deviation for negative deviations", () => {
    // Arrange
    const violations: Array<ToleranceViolation> = [
      {
        field: "power",
        expected: 250,
        actual: 248,
        deviation: -2,
        tolerance: 1,
      },
    ];

    // Act
    const stripped = stripAnsi(formatToleranceViolations(violations));

    // Assert
    expect(stripped).toContain("deviation: 2");
  });

  it("should still contain correct content when FORCE_COLOR is set", () => {
    // Arrange
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

    // Act
    const stripped = stripAnsi(formatToleranceViolations(violations));

    // Assert
    expect(stripped).toContain("Tolerance violations:");
    expect(stripped).toContain("power");
    expect(stripped).toContain("expected 250, got 252");
  });
});
