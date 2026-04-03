import { execa } from "execa";
import { resolve } from "path";
import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";
import { getFixturePath } from "../tests/helpers/fixture-paths";

const cliPath = resolve(__dirname, "../bin/kaiord.ts");

describe("extract-workout command integration tests", () => {
  it(
    "should extract workout JSON from a KRD file",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const inputPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "extract-workout", "--input", inputPath],
        { reject: false }
      );

      // Assert
      expect(result.exitCode).toBe(0);
      const workout = JSON.parse(result.stdout);
      expect(workout.sport).toBeDefined();
      expect(workout.steps).toBeDefined();
      expect(Array.isArray(workout.steps)).toBe(true);
      expect(workout.steps.length).toBeGreaterThan(0);
    }
  );

  it(
    "should extract workout JSON from a FIT file",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "extract-workout", "--input", inputPath],
        { reject: false }
      );

      // Assert
      expect(result.exitCode).toBe(0);
      const workout = JSON.parse(result.stdout);
      expect(workout.sport).toBeDefined();
      expect(workout.steps).toBeDefined();
    }
  );

  it(
    "should fail with exit code 2 for missing file",
    { timeout: 30_000 },
    async () => {
      // Arrange & Act
      const result = await execa(
        "tsx",
        [cliPath, "extract-workout", "--input", "nonexistent.fit"],
        { reject: false }
      );

      // Assert
      expect(result.exitCode).toBe(2);
      const output = stripAnsi(result.stderr);
      expect(output).toContain("File not found");
    }
  );

  it(
    "should suppress spinner output with --quiet flag",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const inputPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "extract-workout", "--input", inputPath, "--quiet"],
        { reject: false }
      );

      // Assert
      expect(result.exitCode).toBe(0);
      const workout = JSON.parse(result.stdout);
      expect(workout.sport).toBeDefined();
      const stderr = stripAnsi(result.stderr);
      expect(stderr).not.toContain("Extracting workout");
    }
  );
});
