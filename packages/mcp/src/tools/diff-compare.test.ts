import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { compareKrdFiles } from "./diff-compare";

const createKrd = (overrides?: Partial<KRD>): KRD => ({
  version: "1.0",
  type: "recorded_activity",
  metadata: {
    created: "2025-01-15T10:00:00Z",
    sport: "cycling",
  },
  ...overrides,
});

describe("compareKrdFiles", () => {
  describe("metadata comparison", () => {
    it("should return empty diffs for identical metadata", () => {
      // Arrange
      const krd1 = createKrd();
      const krd2 = createKrd();

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.metadata).toHaveLength(0);
    });

    it.each([
      { field: "sport", v1: "cycling", v2: "running" },
      { field: "manufacturer", v1: "Garmin", v2: "Wahoo" },
    ])("should detect metadata differences in $field", ({ field, v1, v2 }) => {
      // Arrange
      const krd1 = createKrd({
        metadata: {
          created: "2025-01-15T10:00:00Z",
          sport: "cycling",
          [field]: v1,
        },
      });
      const krd2 = createKrd({
        metadata: {
          created: "2025-01-15T10:00:00Z",
          sport: "cycling",
          [field]: v2,
        },
      });

      // Act
      const result = compareKrdFiles(krd1, krd2);
      const diff = result.metadata.find((d) => d.field === field);

      // Assert
      expect(diff).toBeDefined();
      expect(diff?.file1).toBe(v1);
      expect(diff?.file2).toBe(v2);
    });
  });

  describe("steps comparison", () => {
    it("should return zero counts when no workouts exist", () => {
      // Arrange
      const krd1 = createKrd();
      const krd2 = createKrd();

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.steps.file1Count).toBe(0);
      expect(result.steps.file2Count).toBe(0);
      expect(result.steps.diffs).toHaveLength(0);
    });

    it("should detect different step counts", () => {
      // Arrange
      const krd1 = createKrd({
        extensions: {
          structured_workout: { steps: [{ type: "warmup" }] },
        },
      });
      const krd2 = createKrd({
        extensions: {
          structured_workout: {
            steps: [{ type: "warmup" }, { type: "active" }],
          },
        },
      });

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.steps.file1Count).toBe(1);
      expect(result.steps.file2Count).toBe(2);
    });

    it("should detect step content differences", () => {
      // Arrange
      const krd1 = createKrd({
        extensions: {
          structured_workout: { steps: [{ type: "warmup", duration: 300 }] },
        },
      });
      const krd2 = createKrd({
        extensions: {
          structured_workout: { steps: [{ type: "warmup", duration: 600 }] },
        },
      });

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.steps.diffs).toHaveLength(1);
      expect(result.steps.diffs[0].field).toBe("step[0]");
    });
  });

  describe("extensions comparison", () => {
    it("should return empty when both have no extensions", () => {
      // Arrange
      const krd1 = createKrd();
      const krd2 = createKrd();

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.extensions.file1Keys).toHaveLength(0);
      expect(result.extensions.file2Keys).toHaveLength(0);
      expect(result.extensions.diffs).toHaveLength(0);
    });

    it("should list extension keys from both files", () => {
      // Arrange
      const krd1 = createKrd({
        extensions: { structured_workout: { steps: [] } },
      });
      const krd2 = createKrd({
        extensions: { custom_data: { foo: "bar" } },
      });

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.extensions.file1Keys).toContain("structured_workout");
      expect(result.extensions.file2Keys).toContain("custom_data");
    });

    it("should detect extension value differences", () => {
      // Arrange
      const krd1 = createKrd({
        extensions: { notes: "First version" },
      });
      const krd2 = createKrd({
        extensions: { notes: "Second version" },
      });

      // Act
      const result = compareKrdFiles(krd1, krd2);

      // Assert
      expect(result.extensions.diffs).toHaveLength(1);
      expect(result.extensions.diffs[0].field).toBe("notes");
    });
  });
});
