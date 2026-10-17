import { describe, expect, it } from "vitest";

import { applyReadBudget } from "./read-budget";

const ROOMY = 10_000;
const CAP = 2;

describe("applyReadBudget", () => {
  it("should keep the newest rows up to the row cap", () => {
    // Arrange
    const rows = ["a", "b", "c"];

    // Act
    const result = applyReadBudget({}, "rows", rows, {
      maxRows: CAP,
      maxBytes: ROOMY,
    });

    // Assert
    expect(result).toEqual({ rows: ["b", "c"], truncated: true, omitted: 1 });
  });

  it("should keep no rows when the row cap is zero", () => {
    // Arrange
    const rows = ["a", "b"];

    // Act
    const result = applyReadBudget({}, "rows", rows, {
      maxRows: 0,
      maxBytes: ROOMY,
    });

    // Assert
    expect(result).toEqual({ rows: [], truncated: true, omitted: 2 });
  });

  it("should keep no rows when the envelope alone exceeds the byte budget", () => {
    // Arrange
    const envelope = { note: "x".repeat(ROOMY) };

    // Act
    const result = applyReadBudget(envelope, "rows", ["a"], {
      maxRows: CAP,
      maxBytes: ROOMY,
    });

    // Assert
    expect(result).toMatchObject({ rows: [], truncated: true, omitted: 1 });
  });
});
