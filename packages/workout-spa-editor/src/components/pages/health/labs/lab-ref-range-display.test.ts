import { describe, expect, it } from "vitest";

import { formatRefRange, refSourceLabel } from "./lab-ref-range-display";

describe("formatRefRange", () => {
  it("should render both canonical bounds as a low–high range", () => {
    // Arrange
    const value = { refLowCanonical: 0.6, refHighCanonical: 1.1 };

    // Act
    const out = formatRefRange(value);

    // Assert
    expect(out).toBe("0.6–1.1");
  });

  it("should render a one-sided lower bound with ≥", () => {
    // Arrange
    const value = { refLowCanonical: 40 };

    // Act
    const out = formatRefRange(value);

    // Assert
    expect(out).toBe("≥ 40");
  });

  it("should fall back to raw refText when no numeric bounds exist", () => {
    // Arrange
    const value = { refText: "negative" };

    // Act
    const out = formatRefRange(value);

    // Assert
    expect(out).toBe("negative");
  });

  it("should render the em-dash placeholder when nothing is available", () => {
    // Arrange
    const value = {};

    // Act
    const out = formatRefRange(value);

    // Assert
    expect(out).toBe("—");
  });
});

describe("refSourceLabel", () => {
  it("should label a report-sourced range as from report", () => {
    // Arrange
    const source = "report" as const;

    // Act
    const label = refSourceLabel(source);

    // Assert
    expect(label).toBe("from report");
  });
});
