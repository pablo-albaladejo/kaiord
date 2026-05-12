import { describe, expect, it } from "vitest";

import type { WorkoutTemplate } from "../../../../../types/workout-library";
import { sortTemplates } from "./sort-utils";

const tpl = (overrides: Partial<WorkoutTemplate>): WorkoutTemplate =>
  ({
    id: "00000000-0000-0000-0000-000000000000",
    name: "Default",
    sport: "running",
    krd: {},
    tags: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  }) as unknown as WorkoutTemplate;

describe("sortTemplates", () => {
  it("should sort templates by name ascending using localeCompare", () => {
    // Arrange
    const templates = [
      tpl({ name: "Charlie" }),
      tpl({ name: "Alpha" }),
      tpl({ name: "Bravo" }),
    ];

    // Act
    const result = sortTemplates(templates, "name", "asc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("should sort templates by name descending (negate comparison)", () => {
    // Arrange
    const templates = [
      tpl({ name: "Charlie" }),
      tpl({ name: "Alpha" }),
      tpl({ name: "Bravo" }),
    ];

    // Act
    const result = sortTemplates(templates, "name", "desc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("should sort templates by date ascending using createdAt", () => {
    // Arrange
    const templates = [
      tpl({ name: "A", createdAt: "2024-01-01T00:00:00.000Z" }),
      tpl({ name: "C", createdAt: "2024-03-01T00:00:00.000Z" }),
      tpl({ name: "B", createdAt: "2024-02-01T00:00:00.000Z" }),
    ];

    // Act
    const result = sortTemplates(templates, "date", "asc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["A", "B", "C"]);
  });

  it("should sort templates by date descending using createdAt", () => {
    // Arrange
    const templates = [
      tpl({ name: "A", createdAt: "2024-01-01T00:00:00.000Z" }),
      tpl({ name: "C", createdAt: "2024-03-01T00:00:00.000Z" }),
      tpl({ name: "B", createdAt: "2024-02-01T00:00:00.000Z" }),
    ];

    // Act
    const result = sortTemplates(templates, "date", "desc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["C", "B", "A"]);
  });

  it("should sort templates by difficulty ascending (easy=1 < medium=2 < hard=3)", () => {
    // Arrange
    const templates = [
      tpl({ name: "H", difficulty: "hard" as WorkoutTemplate["difficulty"] }),
      tpl({ name: "E", difficulty: "easy" as WorkoutTemplate["difficulty"] }),
      tpl({
        name: "M",
        difficulty: "medium" as unknown as WorkoutTemplate["difficulty"],
      }),
    ];

    // Act
    const result = sortTemplates(templates, "difficulty", "asc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["E", "M", "H"]);
  });

  it("should sort templates by difficulty descending", () => {
    // Arrange
    const templates = [
      tpl({ name: "H", difficulty: "hard" as WorkoutTemplate["difficulty"] }),
      tpl({ name: "E", difficulty: "easy" as WorkoutTemplate["difficulty"] }),
      tpl({
        name: "M",
        difficulty: "medium" as unknown as WorkoutTemplate["difficulty"],
      }),
    ];

    // Act
    const result = sortTemplates(templates, "difficulty", "desc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["H", "M", "E"]);
  });

  it("should treat schema 'moderate' difficulty as 0 via the || fallback (sorts before easy)", () => {
    // Arrange
    const templates = [
      tpl({ name: "E", difficulty: "easy" as WorkoutTemplate["difficulty"] }),
      tpl({
        name: "Mod",
        difficulty: "moderate" as WorkoutTemplate["difficulty"],
      }),
    ];

    // Act
    const result = sortTemplates(templates, "difficulty", "asc");

    // Assert
    expect(result.map((t) => t.name)).toEqual(["Mod", "E"]);
  });

  it("should produce a new array (not mutate the input)", () => {
    // Arrange
    const templates = [
      tpl({ name: "Charlie" }),
      tpl({ name: "Alpha" }),
      tpl({ name: "Bravo" }),
    ];
    const original = templates.map((t) => t.name);

    // Act
    sortTemplates(templates, "name", "asc");

    // Assert
    expect(templates.map((t) => t.name)).toEqual(original);
  });

  it("should preserve length when input has duplicates", () => {
    // Arrange
    const templates = [tpl({ name: "Same" }), tpl({ name: "Same" })];

    // Act
    const result = sortTemplates(templates, "name", "asc");

    // Assert
    expect(result).toHaveLength(2);
  });
});
