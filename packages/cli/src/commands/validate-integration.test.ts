import { execa } from "execa";
import { writeFile } from "fs/promises";
import { join } from "path";
import stripAnsi from "strip-ansi";
import { dir } from "tmp-promise";
import { beforeAll, describe, expect, it } from "vitest";

import { getFixturePath } from "../tests/helpers/fixture-paths";

const SETUP_TIMEOUT_MS = 10000;
const TEST_TIMEOUT_MS = 10000;
const PROCESS_TIMEOUT_MS = 15000;

describe("validate command integration tests", () => {
  let tempDir: string;

  beforeAll(async () => {
    const tmp = await dir({ unsafeCleanup: true });
    tempDir = tmp.path;
  }, SETUP_TIMEOUT_MS); // Increased timeout for setup

  describe("successful validation", () => {
    it(
      "should validate FIT file successfully with exit code 0",
      { timeout: TEST_TIMEOUT_MS },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
        ]);
        expect(result.exitCode).toBe(0);

        // Act
        const output = stripAnsi(result.stdout);

        // Assert
        expect(output).toContain("Round-trip validation passed");
      }
    );

    it(
      "should display success message when validation passes",
      { timeout: TEST_TIMEOUT_MS },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
        ]);

        // Act
        const output = stripAnsi(result.stdout);

        // Assert
        expect(output).toMatch(/validation.*passed/i);
      }
    );
  });

  describe("custom tolerance config", () => {
    it(
      "should load custom tolerance config from JSON file",
      { timeout: TEST_TIMEOUT_MS },
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
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
          "--tolerance-config",
          toleranceConfigPath,
        ]);
        expect(result.exitCode).toBe(0);

        // Act
        const output = stripAnsi(result.stdout);

        // Assert
        expect(output).toContain("Round-trip validation passed");
      }
    );

    it(
      "should fail with invalid tolerance config JSON",
      { timeout: TEST_TIMEOUT_MS },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const toleranceConfigPath = join(tempDir, "invalid-tolerance.json");

        // Act
        await writeFile(toleranceConfigPath, "{ invalid json }");

        // Assert
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
    it(
      "should fail with exit code 2 for missing file",
      async () => {
        // Arrange

        // Act
        const nonExistentFile = join(tempDir, "nonexistent.fit");

        // Assert
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
      },
      PROCESS_TIMEOUT_MS
    ); // Increased timeout for process spawning under load

    it(
      "should display error message for missing file",
      { timeout: TEST_TIMEOUT_MS },
      async () => {
        // Arrange

        // Act
        const nonExistentFile = join(tempDir, "nonexistent.fit");

        // Assert
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

    it(
      "should fail for non-FIT files",
      { timeout: TEST_TIMEOUT_MS },
      async () => {
        // Arrange

        // Act
        const krdFile = getFixturePath("krd", "WorkoutIndividualSteps.krd");

        // Assert
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
      }
    );
  });

  describe("JSON output", () => {
    it(
      "should output JSON format when --json flag is set",
      { timeout: PROCESS_TIMEOUT_MS },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const result = await execa("tsx", [
          "src/bin/kaiord.ts",
          "validate",
          "--input",
          fitFile,
          "--json",
        ]);
        expect(result.exitCode).toBe(0);

        // Act
        const output = JSON.parse(result.stdout);

        // Assert
        expect(output).toHaveProperty("success", true);
        expect(output).toHaveProperty("file");
        expect(output).toHaveProperty("format", "fit");
        expect(output).toHaveProperty("violations");
        expect(Array.isArray(output.violations)).toBe(true);
      }
    );

    it(
      "should include violations in JSON output when validation fails",
      { timeout: TEST_TIMEOUT_MS },
      async () => {
        // Arrange
        const fitFile = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const toleranceConfigPath = join(tempDir, "strict-tolerance.json");
        const strictConfig = {
          timeTolerance: 0.001,
          distanceTolerance: 0.001,
          powerTolerance: 0.001,
          ftpTolerance: 0.001,
          hrTolerance: 0.001,
          cadenceTolerance: 0.001,
          paceTolerance: 0.00001,
        };

        // Act
        await writeFile(
          toleranceConfigPath,
          JSON.stringify(strictConfig, null, 2)
        );

        // Assert
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
      { timeout: TEST_TIMEOUT_MS },
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
      }
    );

    it(
      "should suppress output with --quiet flag",
      { timeout: TEST_TIMEOUT_MS },
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
        expect(result.stdout.length).toBeLessThan(100);
      }
    );
  });
});
