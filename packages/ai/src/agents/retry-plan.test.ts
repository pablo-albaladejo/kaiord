import { describe, expect, it } from "vitest";
import { nextOutputBudget } from "./retry-plan";

const BUDGET = 4096;
const CEILING = 16384;
const ABOVE_CEILING = 32000;

describe("nextOutputBudget", () => {
  it("should double the budget after a truncation", () => {
    // Arrange
    const budget = BUDGET;

    // Act
    const next = nextOutputBudget(budget, "truncated");

    // Assert
    expect(next).toBe(BUDGET * 2);
  });

  it("should stop growing at the ceiling", () => {
    // Arrange
    const budget = CEILING - 1;

    // Act
    const next = nextOutputBudget(budget, "truncated");

    // Assert
    expect(next).toBe(CEILING);
  });

  it("should keep a caller's budget that is already above the ceiling", () => {
    // Arrange
    const budget = ABOVE_CEILING;

    // Act
    const next = nextOutputBudget(budget, "truncated");

    // Assert
    expect(next).toBe(ABOVE_CEILING);
  });

  it("should keep the budget when the retry is not a truncation", () => {
    // Arrange
    const budget = BUDGET;

    // Act
    const next = nextOutputBudget(budget, "invalid");

    // Assert
    expect(next).toBe(BUDGET);
  });
});
