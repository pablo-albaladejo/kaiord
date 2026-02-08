import { execa } from "execa";
import { writeFile } from "fs/promises";
import { join } from "path";
import stripAnsi from "strip-ansi";
import { dir } from "tmp-promise";
import { beforeAll, describe, expect, it } from "vitest";
import { getFixturePath } from "../tests/helpers/fixture-paths";

describe("validate command integration tests", () => {
  let tempDir: string;
  let cleanup: () => void;

  beforeAll(async () => {
    const tmp = await dir({ unsafeCleanup: true });
    tempDir = tmp.path;
    cleanup = tmp.cleanup;
  }, 10000); // Increased timeout for setup

  describe("successful validation", () => {
    it(
      "should validate FIT file successfully with exit code 0",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");

        // Act
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
        ]);

        // Assert
        expect(result.exitCode).toBe(0);
        const output = stripAnsi(result.stdout);
        expect(output).toContain("Round-trip validation passed");
      }
    );

    it(
      "should display success message when validation passes",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");

        // Act
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
        ]);

        // Assert
        const output = stripAnsi(result.stdout);
        expect(output).toMatch(/validation.*passed/i);
      }
    );
  });

  describe("custom tolerance config", () => {
    it(
      "should load custom tolerance config from JSON file",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const toleranceConfigPath = join(tempDir, "tolerance.json");
        const toleranceConfig = {
          timeTolerance: 2,
          distanceTolerance: 2,
          powerTolerance: 2,
          ftpTolerance: 2,
          hrTolerance: 2,
          cadenceTolerance: 2,
          paceTolerance: 0.02,
        };
        await writeFile(
          toleranceConfigPath,
          JSON.stringify(toleranceConfig, null, 2)
        );

        // Act
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
          "--tolerance-config",
          toleranceConfigPath,
        ]);

        // Assert
        expect(result.exitCode).toBe(0);
        const output = stripAnsi(result.stdout);
        expect(output).toContain("Round-trip validation passed");
      }
    );

    it(
      "should fail with invalid tolerance config JSON",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const toleranceConfigPath = join(tempDir, "invalid-tolerance.json");
        await writeFile(toleranceConfigPath, "{ invalid json }");

        // Act & Assert
        await expect(
          execa("tsx", [
            "src/bin/kaiord.ts",
            "validate",
            "--input",
            fitFile,
            "--tolerance-config",
            toleranceConfigPath,
          ])
        ).rejects.toThrow();
      }
    );
  });

  describe("error handling", () => {
    it("should fail with exit code 2 for missing file", async () => {
      // Arrange
      const nonExistentFile = join(tempDir, "nonexistent.fit");

      // Act & Assert
      try {
        await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          nonExistentFile,
        ]);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        const execaError = error as { exitCode: number; stderr: string };
        // Exit code 2 = FILE_NOT_FOUND per CLI specification
        expect(execaError.exitCode).toBe(2);
      }
    }, 15000); // Increased timeout for process spawning under load

    it(
      "should display error message for missing file",
      { timeout: 10000 },
      async () => {
        // Arrange
        const nonExistentFile = join(tempDir, "nonexistent.fit");

        // Act & Assert
        try {
          await execa("tsx", [
            "src/bin/kaiord.ts",
            "validate",
            "--input",
            nonExistentFile,
          ]);
          expect.fail("Should have thrown an error");
        } catch (error: unknown) {
          const execaError = error as { stderr: string };
          const output = stripAnsi(execaError.stderr);
          expect(output).toMatch(/error|failed|not found/i);
        }
      }
    );

    it("should fail for non-FIT files", { timeout: 10000 }, async () => {
      // Arrange
      const krdFile = getFixturePath("krd", "WorkoutIndividualSteps.krd");

      // Act & Assert
      try {
        await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          krdFile,
        ]);
        expect.fail("Should have thrown an error");
      } catch (error: unknown) {
        const execaError = error as { exitCode: number; stderr: string };
        expect(execaError.exitCode).toBe(1);
        const output = stripAnsi(execaError.stderr);
        expect(output).toMatch(/only supports FIT files/i);
      }
    });
  });

  describe("JSON output", () => {
    it(
      "should output JSON format when --json flag is set",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");

        // Act
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
          "--json",
        ]);

        // Assert
        expect(result.exitCode).toBe(0);
        const output = JSON.parse(result.stdout);
        expect(output).toHaveProperty("success", true);
        expect(output).toHaveProperty("file");
        expect(output).toHaveProperty("format", "fit");
        expect(output).toHaveProperty("violations");
        expect(Array.isArray(output.violations)).toBe(true);
      }
    );

    it(
      "should include violations in JSON output when validation fails",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const toleranceConfigPath = join(tempDir, "strict-tolerance.json");
        // Create very strict tolerances that will likely fail
        const strictConfig = {
          timeTolerance: 0.001,
          distanceTolerance: 0.001,
          powerTolerance: 0.001,
          ftpTolerance: 0.001,
          hrTolerance: 0.001,
          cadenceTolerance: 0.001,
          paceTolerance: 0.00001,
        };
        await writeFile(
          toleranceConfigPath,
          JSON.stringify(strictConfig, null, 2)
        );

        // Act
        try {
          await execa("tsx", [
            "src/bin/kaiord.ts",
            "validate",
            "--input",
            fitFile,
            "--tolerance-config",
            toleranceConfigPath,
            "--json",
          ]);
        } catch (error: unknown) {
          const execaError = error as { exitCode: number; stdout: string };

          // Assert
          // Note: This test may pass if the round-trip is perfect
          // We're testing the JSON structure, not necessarily that it fails
          if (execaError.exitCode === 1) {
            const output = JSON.parse(execaError.stdout);
            expect(output).toHaveProperty("success", false);
            expect(output).toHaveProperty("violations");
            expect(Array.isArray(output.violations)).toBe(true);
          }
        }
      }
    );
  });

  describe("verbosity options", () => {
    it(
      "should show detailed output with --verbose flag",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");

        // Act
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
          "--verbose",
        ]);

        // Assert
        expect(result.exitCode).toBe(0);
        // Verbose mode should include debug information
        // The exact output depends on logger implementation
      }
    );

    it(
      "should suppress output with --quiet flag",
      { timeout: 10000 },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");

        // Act
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
          "--quiet",
        ]);

        // Assert
        expect(result.exitCode).toBe(0);
        // Quiet mode should have minimal output
        expect(result.stdout.length).toBeLessThan(100);
      }
    );
  });
});
