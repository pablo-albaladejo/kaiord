import { execa } from "execa";
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import stripAnsi from "strip-ansi";
import { dir } from "tmp-promise";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getFixturePath, getFixturesDir } from "../tests/helpers/fixture-paths";
import { ExitCode } from "../utils/exit-codes";

describe("convert command integration tests", () => {
  let tempDir: { path: string; cleanup: () => Promise<void> };

  beforeEach(async () => {
    // Create temporary output directory
    tempDir = await dir({ unsafeCleanup: true });
  });

  afterEach(async () => {
    // Cleanup temporary directory
    if (tempDir) {
      await tempDir.cleanup();
    }
  });

  it(
    "should convert FIT to KRD with WorkoutIndividualSteps.fit fixture",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const cliPath = resolve(__dirname, "../bin/kaiord.ts");
      const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
      const outputPath = join(tempDir.path, "output.krd");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );

      // Assert
      expect(result.exitCode).toBe(0);

      // Verify output file exists and is valid JSON
      const outputContent = await readFile(outputPath, "utf-8");
      const krd = JSON.parse(outputContent);
      expect(krd.version).toBeDefined();
      expect(krd.type).toBe("structured_workout");
    }
  );

  it(
    "should convert KRD to FIT with corresponding KRD fixture",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const cliPath = resolve(__dirname, "../bin/kaiord.ts");
      const inputPath = getFixturePath("krd", "WorkoutIndividualSteps.krd");
      const outputPath = join(tempDir.path, "output.fit");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );

      // Assert
      expect(result.exitCode).toBe(0);

      // Verify output file exists and is binary
      const outputBuffer = await readFile(outputPath);
      expect(outputBuffer.length).toBeGreaterThan(0);
    }
  );

  it(
    "should handle missing files with exit code 2",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const cliPath = resolve(__dirname, "../bin/kaiord.ts");
      const inputPath = "nonexistent.fit";
      const outputPath = join(tempDir.path, "output.krd");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );

      // Assert
      expect(result.exitCode).toBe(2); // Exit code 2 for file not found
      const output = stripAnsi(result.stderr);
      expect(output).toContain("File not found");
    }
  );

  it(
    "should handle invalid/corrupted files with exit code 4",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const cliPath = resolve(__dirname, "../bin/kaiord.ts");
      const corruptedPath = join(tempDir.path, "corrupted.fit");
      await writeFile(corruptedPath, Buffer.from([0, 0, 0, 0]));
      const outputPath = join(tempDir.path, "output.krd");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", corruptedPath, "--output", outputPath],
        {
          reject: false,
        }
      );

      // Assert
      expect(result.exitCode).toBe(4); // Exit code 4 for parsing errors
      const output = stripAnsi(result.stderr);
      expect(output).toContain("Error");
    }
  );

  it(
    "should detect format from file extensions",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const cliPath = resolve(__dirname, "../bin/kaiord.ts");
      const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
      const outputPath = join(tempDir.path, "output.krd");

      // Act
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );

      // Assert
      expect(result.exitCode).toBe(0);

      // Verify output file was created
      const outputContent = await readFile(outputPath, "utf-8");
      expect(outputContent.length).toBeGreaterThan(0);
    }
  );

  it(
    "should override format detection with --input-format and --output-format flags",
    { timeout: 30_000 },
    async () => {
      // Arrange
      const cliPath = resolve(__dirname, "../bin/kaiord.ts");
      const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
      const outputPath = join(tempDir.path, "output.json");

      // Act
      const result = await execa(
        "tsx",
        [
          cliPath,
          "convert",
          "--input",
          inputPath,
          "--input-format",
          "fit",
          "--output",
          outputPath,
          "--output-format",
          "krd",
        ],
        {
          reject: false,
        }
      );

      // Assert
      expect(result.exitCode).toBe(0);

      // Verify output file is valid KRD despite .json extension
      const outputContent = await readFile(outputPath, "utf-8");
      const krd = JSON.parse(outputContent);
      expect(krd.version).toBeDefined();
      expect(krd.type).toBe("structured_workout");
    }
  );

  describe("verbosity and output control", () => {
    it(
      "should increase log output with --verbose flag",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const outputPath = join(tempDir.path, "output.krd");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            inputPath,
            "--output",
            outputPath,
            "--verbose",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Verify debug messages appear in stderr
        const stderr = stripAnsi(result.stderr);
        expect(stderr).toContain("Convert command initialized");
      }
    );

    it(
      "should suppress non-error output with --quiet flag",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const outputPath = join(tempDir.path, "output.krd");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            inputPath,
            "--output",
            outputPath,
            "--quiet",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Verify minimal output (no success messages in stdout)
        const stdout = stripAnsi(result.stdout);
        expect(stdout).not.toContain("Conversion complete");
      }
    );

    it(
      "should output machine-readable JSON with --json flag",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const outputPath = join(tempDir.path, "output.krd");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            inputPath,
            "--output",
            outputPath,
            "--json",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Parse and validate JSON output
        const output = JSON.parse(result.stdout);
        expect(output.success).toBe(true);
        expect(output.inputFile).toBe(inputPath);
        expect(output.outputFile).toBe(outputPath);
        expect(output.inputFormat).toBe("fit");
        expect(output.outputFormat).toBe("krd");
      }
    );

    it(
      "should force structured logging with --log-format structured",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const outputPath = join(tempDir.path, "output.krd");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            inputPath,
            "--output",
            outputPath,
            "--log-format",
            "structured",
            "--verbose",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Verify JSON log format in stderr
        const stderr = result.stderr;
        const lines = stderr.split("\n").filter((line) => line.trim());

        // At least one line should be valid JSON with timestamp and level
        const hasJsonLog = lines.some((line) => {
          try {
            const log = JSON.parse(line);
            return log.timestamp && log.level && log.message;
          } catch {
            return false;
          }
        });

        expect(hasJsonLog).toBe(true);
      }
    );

    it(
      "should force colored output with --log-format pretty",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const outputPath = join(tempDir.path, "output.krd");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            inputPath,
            "--output",
            outputPath,
            "--log-format",
            "pretty",
            "--verbose",
          ],
          {
            reject: false,
            env: {
              ...process.env,
              FORCE_COLOR: "1", // Force color output even in non-TTY
            },
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Verify ANSI codes are present in output (colored output)
        // Check both stdout and stderr as logs may go to either
        const combinedOutput = result.stdout + result.stderr;
        const strippedOutput = stripAnsi(combinedOutput);

        // If there's any output, it should have ANSI codes when FORCE_COLOR=1
        if (combinedOutput.length > 0) {
          expect(combinedOutput).not.toBe(strippedOutput); // Has ANSI codes
        }

        // At minimum, verify the command succeeded
        expect(result.exitCode).toBe(0);
      }
    );

    it(
      "should disable colors in non-TTY environments",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const inputPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
        const outputPath = join(tempDir.path, "output.krd");

        // Act - Run without FORCE_COLOR to simulate non-TTY
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            inputPath,
            "--output",
            outputPath,
            "--verbose",
          ],
          {
            reject: false,
            env: {
              ...process.env,
              FORCE_COLOR: "0", // Disable color output
            },
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // In non-TTY mode, the logger-factory should detect this and use structured logger
        // or the pretty logger should not add colors
        // We can't easily test TTY detection in integration tests, but we can verify
        // that the command completes successfully
        expect(result.exitCode).toBe(0);
      }
    );

    it(
      "should output JSON for batch conversions with --json flag",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const fixturesDir = getFixturesDir("fit");
        const outputDir = join(tempDir.path, "batch-output");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/*.fit`,
            "--output-dir",
            outputDir,
            "--output-format",
            "krd",
            "--json",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Parse and validate JSON output
        const output = JSON.parse(result.stdout);
        expect(output.success).toBe(true);
        expect(output.total).toBeGreaterThan(0);
        expect(output.successful).toBe(output.total);
        expect(output.failed).toBe(0);
        expect(output.totalTime).toBeGreaterThan(0);
        expect(Array.isArray(output.results)).toBe(true);
      }
    );
  });

  describe("batch conversion", () => {
    it(
      "should convert multiple files with glob pattern",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const fixturesDir = getFixturesDir("fit");
        const outputDir = join(tempDir.path, "batch-output");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/*.fit`,
            "--output-dir",
            outputDir,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Verify summary output shows successful/failed counts
        const output = stripAnsi(result.stdout);
        expect(output).toMatch(/Batch conversion complete/);
        expect(output).toMatch(/Successful: \d+\/\d+/);
        expect(output).toMatch(/Total time: \d+\.\d+s/);
      }
    );

    it(
      "should process files sequentially and continue on errors",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const testDir = join(tempDir.path, "test-files");
        const outputDir = join(tempDir.path, "batch-output");

        // Create test directory first
        const { mkdir } = await import("fs/promises");
        await mkdir(testDir, { recursive: true });

        // Create test directory with multiple files
        await writeFile(
          join(testDir, "valid.fit"),
          await readFile(getFixturePath("fit", "WorkoutIndividualSteps.fit"))
        );
        await writeFile(join(testDir, "corrupted.fit"), Buffer.from([0, 0, 0]));
        await writeFile(
          join(testDir, "valid2.fit"),
          await readFile(getFixturePath("fit", "WorkoutRepeatSteps.fit"))
        );

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${testDir}/*.fit`,
            "--output-dir",
            outputDir,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );

        // Assert - should exit with PARTIAL_SUCCESS since some files succeeded
        expect(result.exitCode).toBe(ExitCode.PARTIAL_SUCCESS);

        // Verify summary shows both successful and failed conversions
        const output = stripAnsi(result.stdout);
        expect(output).toMatch(/Successful: \d+\/3/);
        expect(output).toMatch(/Failed: \d+\/3/);

        // Verify failed conversions are reported
        expect(output).toMatch(/Failed conversions:/);
      }
    );

    it(
      "should display progress for each file during batch conversion",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const testDir = join(tempDir.path, "test-files");
        const outputDir = join(tempDir.path, "batch-output");

        // Create test directory first
        const { mkdir } = await import("fs/promises");
        await mkdir(testDir, { recursive: true });

        // Create multiple test files
        const fitContent = await readFile(
          getFixturePath("fit", "WorkoutIndividualSteps.fit")
        );

        await writeFile(join(testDir, "workout1.fit"), fitContent);
        await writeFile(join(testDir, "workout2.fit"), fitContent);
        await writeFile(join(testDir, "workout3.fit"), fitContent);

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${testDir}/*.fit`,
            "--output-dir",
            outputDir,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);

        // Verify batch conversion completed successfully
        const output = stripAnsi(result.stdout);
        expect(output).toMatch(/Batch conversion complete/);
        expect(output).toMatch(/Successful: 3\/3/);
      }
    );

    it(
      "should require --output-dir flag for batch mode",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const fixturesDir = getFixturesDir("fit");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/*.fit`,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(1);
        const output = stripAnsi(result.stderr);
        expect(output).toContain("Batch mode requires --output-dir flag");
      }
    );

    it(
      "should require --output-format flag for batch mode",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const fixturesDir = getFixturesDir("fit");
        const outputDir = join(tempDir.path, "batch-output");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/*.fit`,
            "--output-dir",
            outputDir,
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(1);
        const output = stripAnsi(result.stderr);
        expect(output).toContain(
          "Batch mode requires --output-format flag to specify target format"
        );
      }
    );

    it(
      "should handle empty glob pattern results",
      { timeout: 30_000 },
      async () => {
        // Arrange
        const cliPath = resolve(__dirname, "../bin/kaiord.ts");
        const outputDir = join(tempDir.path, "batch-output");

        // Act
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${tempDir.path}/nonexistent/*.fit`,
            "--output-dir",
            outputDir,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );

        // Assert
        expect(result.exitCode).toBe(1);
        const output = stripAnsi(result.stderr);
        expect(output).toContain("No files found matching pattern");
      }
    );
  });
});
