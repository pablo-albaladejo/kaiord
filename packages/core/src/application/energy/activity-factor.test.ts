import { describe, expect, it } from "vitest";

import {
  type ActivityLevel,
  DEFAULT_NEAT_FACTOR,
  NEAT_FACTOR,
  neatFactorForActivityLevel,
} from "./activity-factor";

const LEVELS = Object.keys(NEAT_FACTOR) as ActivityLevel[];

describe("neatFactorForActivityLevel", () => {
  it.each(LEVELS)("should map %s to its NEAT_FACTOR entry", (level) => {
    // Arrange
    const expected = NEAT_FACTOR[level];

    // Act
    const factor = neatFactorForActivityLevel(level);

    // Assert
    expect(factor).toBe(expected);
  });

  it("should rank the factors monotonically from sedentary to very_active", () => {
    // Arrange
    const ordered = LEVELS.map((level) => NEAT_FACTOR[level]);

    // Act
    const sorted = [...ordered].sort((a, b) => a - b);

    // Assert
    expect(ordered).toEqual(sorted);
    expect(NEAT_FACTOR.sedentary).toBe(DEFAULT_NEAT_FACTOR);
  });

  it("should fall back to the default factor when the level is undefined", () => {
    // Arrange
    const level = undefined;

    // Act
    const factor = neatFactorForActivityLevel(level);

    // Assert
    expect(factor).toBe(DEFAULT_NEAT_FACTOR);
  });

  it("should fall back to the default factor when the level is null", () => {
    // Arrange
    const level = null;

    // Act
    const factor = neatFactorForActivityLevel(level);

    // Assert
    expect(factor).toBe(DEFAULT_NEAT_FACTOR);
  });
});
