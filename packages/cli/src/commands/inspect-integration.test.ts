import { execa } from "execa";
import { resolve } from "path";
import stripAnsi from "strip-ansi";
import { describe, expect, it } from "vitest";
import { getFixturePath } from "../tests/helpers/fixture-paths";

const cliPath = resolve(__dirname, "../bin/kaiord.ts");

describe("inspect command integration tests", () => {
  it("should display summary for a KRD file", { timeout: 30_000 }, async () => {
    // Arrange
    const inputPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");
    const result = await execa(
      "tsx",
      [cliPath, "inspect", "--input", inputPath],
      { reject: false }
    );
    expect(result.exitCode).toBe(0);

    // Act
    const output = stripAnsi(result.stdout);

    // Assert
    expect(output).toContain("Type:");
    expect(output).toContain("Sport:");
    expect(output).toContain("--- Metadata ---");
    expect(output).toContain("--- Data ---");
    expect(output).toContain("--- Workout ---");
  });

  it("should display summary for a FIT file", { timeout: 30_000 }, async () => {
    // Arrange
    const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
    const result = await execa(
      "tsx",
      [cliPath, "inspect", "--input", inputPath],
      { reject: false }
    );
    expect(result.exitCode).toBe(0);

    // Act
    const output = stripAnsi(result.stdout);

    // Assert
    expect(output).toContain("Type:");
    expect(output).toContain("Sport:");
    expect(output).toContain("--- Workout ---");
  });

  it(
    "should output full KRD JSON with --json flag",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const inputPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");
      const result = await execa(
        "tsx",
        [cliPath, "inspect", "--input", inputPath, "--json"],
        { reject: false }
      );
      expect(result.exitCode).toBe(0);

      // Act
      const krd = JSON.parse(result.stdout);

      // Assert
      expect(krd.version).toBeDefined();
      expect(krd.type).toBeDefined();
      expect(krd.metadata).toBeDefined();
    }
  );

  it(
    "should fail with exit code 2 for missing file",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const result = await execa(
        "tsx",
        [cliPath, "inspect", "--input", "nonexistent.fit"],
        { reject: false }
      );
      expect(result.exitCode).toBe(2);

      // Act
      const output = stripAnsi(result.stderr);

      // Assert
      expect(output).toContain("File not found");
    }
  );

  it(
    "should suppress spinner output with --quiet flag",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const inputPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");
      const result = await execa(
        "tsx",
        [cliPath, "inspect", "--input", inputPath, "--quiet"],
        { reject: false }
      );
      expect(result.exitCode).toBe(0);
      const output = stripAnsi(result.stdout);
      expect(output).toContain("Type:");

      // Act
      const stderr = stripAnsi(result.stderr);

      // Assert
      expect(stderr).not.toContain("Inspecting file");
    }
  );
});
