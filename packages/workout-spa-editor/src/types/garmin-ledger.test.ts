import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  garminPlacementSchema,
  parseGarminScheduleId,
  parseGarminWorkoutId,
} from "./garmin-ledger";

// Vitest runs every spa-editor suite from the package root.
const PACKAGE_ROOT = process.cwd();

describe("Garmin branded ids", () => {
  it.each(["1", "1707805999", "90000000000000001"])(
    "should accept the Garmin-shaped id %s",
    (raw) => {
      // Arrange

      // Act
      const ids = [parseGarminWorkoutId(raw), parseGarminScheduleId(raw)];

      // Assert
      expect(ids).toEqual([raw, raw]);
    }
  );

  it.each([
    "0",
    "0123",
    "-1",
    "12a",
    "",
    "pending",
    "garmin-unconfirmed",
    Number.MAX_SAFE_INTEGER,
  ])("should reject %s", (raw) => {
    // Arrange

    // Act
    const ids = [parseGarminWorkoutId(raw), parseGarminScheduleId(raw)];

    // Assert
    expect(ids).toEqual([undefined, undefined]);
  });

  it("should fail tsc when a GarminWorkoutId is passed where a GarminScheduleId is expected", () => {
    // Arrange
    const dir = mkdtempSync(join(tmpdir(), "kaiord-brand-check-"));
    const module = join(PACKAGE_ROOT, "src/types/garmin-ledger");
    writeFileSync(
      join(dir, "check.ts"),
      [
        `import { parseGarminScheduleId, parseGarminWorkoutId } from "${module}";`,
        `import type { GarminScheduleId, GarminWorkoutId } from "${module}";`,
        `const workoutId = parseGarminWorkoutId("1") as GarminWorkoutId;`,
        `const scheduleId = parseGarminScheduleId("2") as GarminScheduleId;`,
        `export const sameBrand: GarminWorkoutId = workoutId;`,
        `// @ts-expect-error a workout id is not a schedule id`,
        `export const wrongSchedule: GarminScheduleId = workoutId;`,
        `// @ts-expect-error a schedule id is not a workout id`,
        `export const wrongWorkout: GarminWorkoutId = scheduleId;`,
        `// @ts-expect-error a bare string is not an id`,
        `export const bare: GarminScheduleId = "3";`,
      ].join("\n")
    );
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        extends: join(PACKAGE_ROOT, "tsconfig.app.json"),
        compilerOptions: { incremental: false, types: [] },
        include: [],
        files: ["check.ts"],
      })
    );
    const tsc = join(PACKAGE_ROOT, "node_modules/.bin/tsc");

    // Act
    const run = () => {
      try {
        execFileSync(tsc, ["-p", join(dir, "tsconfig.json")], {
          encoding: "utf8",
        });
        return "";
      } catch (error) {
        return String((error as { stdout?: unknown }).stdout);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    };
    const diagnostics = run();

    // Assert
    // An unused @ts-expect-error (brands that collapsed) fails with TS2578.
    expect(diagnostics).toBe("");
  });
});

describe("garminPlacementSchema", () => {
  it("should reject a scheduled placement whose schedule id is not Garmin-shaped", () => {
    // Arrange
    const placement = {
      kind: "scheduled",
      workoutScheduleId: "stub-garmin-id",
      workoutId: "1707805999",
      date: "2026-09-28",
    };

    // Act
    const result = garminPlacementSchema.safeParse(placement);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should accept an attempting placement carrying its previous Placed", () => {
    // Arrange
    const placement = {
      kind: "attempting",
      workoutId: "1707805999",
      date: "2026-09-29",
      at: "2026-09-28T10:00:00.000Z",
      posted: true,
      previous: {
        kind: "unconfirmed",
        workoutId: "1707805999",
        date: "2026-09-28",
      },
    };

    // Act
    const result = garminPlacementSchema.safeParse(placement);

    // Assert
    expect(result.success).toBe(true);
  });
});
