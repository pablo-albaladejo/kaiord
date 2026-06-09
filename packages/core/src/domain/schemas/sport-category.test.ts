import { describe, expect, it } from "vitest";

import { sportCategory } from "./sport-category";

describe("sportCategory", () => {
  it("should classify the cycling family as cycling", () => {
    // Arrange
    const sports = ["cycling", "e_biking"] as const;

    // Act
    const categories = sports.map(sportCategory);

    // Assert
    expect(categories).toEqual(["cycling", "cycling"]);
  });

  it("should classify the running family as running", () => {
    // Arrange
    const sports = ["running", "walking", "hiking"] as const;

    // Act
    const categories = sports.map(sportCategory);

    // Assert
    expect(categories).toEqual(["running", "running", "running"]);
  });

  it("should classify swimming as swimming", () => {
    // Arrange
    const sport = "swimming";

    // Act
    const category = sportCategory(sport);

    // Assert
    expect(category).toBe("swimming");
  });

  it("should classify non-endurance sports as other", () => {
    // Arrange
    const sports = ["training", "rowing", "tennis", "generic"] as const;

    // Act
    const categories = sports.map(sportCategory);

    // Assert
    expect(categories).toEqual(["other", "other", "other", "other"]);
  });
});
