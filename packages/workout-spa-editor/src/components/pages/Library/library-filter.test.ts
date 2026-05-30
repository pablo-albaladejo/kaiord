import { describe, expect, it } from "vitest";

import type { WorkoutTemplate } from "../../../types/workout-library";
import { filterTemplates } from "./library-filter";

function makeTemplate(name: string, sport: string): WorkoutTemplate {
  return {
    id: name,
    name,
    sport,
    krd: {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2026-01-01T00:00:00Z", sport },
      extensions: { structured_workout: { name, sport, steps: [] } },
    },
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

const TEMPLATES: WorkoutTemplate[] = [
  makeTemplate("Morning Run", "running"),
  makeTemplate("Bike Intervals", "cycling"),
  makeTemplate("Pool Swim", "swimming"),
];

describe("filterTemplates", () => {
  it("should return all templates when no filters are applied", () => {
    // Arrange

    // Act
    const result = filterTemplates(TEMPLATES, "", "all");

    // Assert
    expect(result).toHaveLength(TEMPLATES.length);
  });

  it("should filter by case-insensitive title substring", () => {
    // Arrange

    // Act
    const result = filterTemplates(TEMPLATES, "bike", "all");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["Bike Intervals"]);
  });

  it("should filter by sport", () => {
    // Arrange

    // Act
    const result = filterTemplates(TEMPLATES, "", "running");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["Morning Run"]);
  });

  it("should combine title and sport filters", () => {
    // Arrange

    // Act
    const result = filterTemplates(TEMPLATES, "swim", "swimming");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["Pool Swim"]);
  });
});
