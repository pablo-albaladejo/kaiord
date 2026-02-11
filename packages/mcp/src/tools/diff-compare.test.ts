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
      const krd1 = createKrd();
      const krd2 = createKrd();

      const result = compareKrdFiles(krd1, krd2);

      expect(result.metadata).toHaveLength(0);
    });

    it("should detect sport differences", () => {
      const krd1 = createKrd({
        metadata: { created: "2025-01-15T10:00:00Z", sport: "cycling" },
      });
      const krd2 = createKrd({
        metadata: { created: "2025-01-15T10:00:00Z", sport: "running" },
      });

      const result = compareKrdFiles(krd1, krd2);

      const sportDiff = result.metadata.find((d) => d.field === "sport");
      expect(sportDiff).toBeDefined();
      expect(sportDiff?.file1).toBe("cycling");
      expect(sportDiff?.file2).toBe("running");
    });

    it("should detect differences in optional fields", () => {
      const krd1 = createKrd({
        metadata: {
          created: "2025-01-15T10:00:00Z",
          sport: "cycling",
          manufacturer: "Garmin",
        },
      });
      const krd2 = createKrd({
        metadata: {
          created: "2025-01-15T10:00:00Z",
          sport: "cycling",
          manufacturer: "Wahoo",
        },
      });

      const result = compareKrdFiles(krd1, krd2);

      const mfgDiff = result.metadata.find((d) => d.field === "manufacturer");
      expect(mfgDiff).toBeDefined();
      expect(mfgDiff?.file1).toBe("Garmin");
      expect(mfgDiff?.file2).toBe("Wahoo");
    });
  });

  describe("steps comparison", () => {
    it("should return zero counts when no workouts exist", () => {
      const krd1 = createKrd();
      const krd2 = createKrd();

      const result = compareKrdFiles(krd1, krd2);

      expect(result.steps.file1Count).toBe(0);
      expect(result.steps.file2Count).toBe(0);
      expect(result.steps.diffs).toHaveLength(0);
    });

    it("should detect different step counts", () => {
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

      const result = compareKrdFiles(krd1, krd2);

      expect(result.steps.file1Count).toBe(1);
      expect(result.steps.file2Count).toBe(2);
    });

    it("should detect step content differences", () => {
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

      const result = compareKrdFiles(krd1, krd2);

      expect(result.steps.diffs).toHaveLength(1);
      expect(result.steps.diffs[0].field).toBe("step[0]");
    });
  });

  describe("extensions comparison", () => {
    it("should return empty when both have no extensions", () => {
      const krd1 = createKrd();
      const krd2 = createKrd();

      const result = compareKrdFiles(krd1, krd2);

      expect(result.extensions.file1Keys).toHaveLength(0);
      expect(result.extensions.file2Keys).toHaveLength(0);
      expect(result.extensions.diffs).toHaveLength(0);
    });

    it("should list extension keys from both files", () => {
      const krd1 = createKrd({
        extensions: { structured_workout: { steps: [] } },
      });
      const krd2 = createKrd({
        extensions: { custom_data: { foo: "bar" } },
      });

      const result = compareKrdFiles(krd1, krd2);

      expect(result.extensions.file1Keys).toContain("structured_workout");
      expect(result.extensions.file2Keys).toContain("custom_data");
    });

    it("should detect extension value differences", () => {
      const krd1 = createKrd({
        extensions: { notes: "First version" },
      });
      const krd2 = createKrd({
        extensions: { notes: "Second version" },
      });

      const result = compareKrdFiles(krd1, krd2);

      expect(result.extensions.diffs).toHaveLength(1);
      expect(result.extensions.diffs[0].field).toBe("notes");
    });
  });
});
