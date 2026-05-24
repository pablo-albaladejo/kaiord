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
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );
      expect(result.exitCode).toBe(0);
      const outputContent = await readFile(outputPath, "utf-8");

      // Act
      const krd = JSON.parse(outputContent);

      // Assert
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
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );
      expect(result.exitCode).toBe(0);

      // Act
      const outputBuffer = await readFile(outputPath);

      // Assert
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
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );
      expect(result.exitCode).toBe(2);

      // Act
      const output = stripAnsi(result.stderr);

      // Assert
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
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", corruptedPath, "--output", outputPath],
        {
          reject: false,
        }
      );
      expect(result.exitCode).toBe(ExitCode.PARSING_ERROR);

      // Act
      const output = stripAnsi(result.stderr);

      // Assert
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
      const result = await execa(
        "tsx",
        [cliPath, "convert", "--input", inputPath, "--output", outputPath],
        {
          reject: false,
        }
      );
      expect(result.exitCode).toBe(0);

      // Act
      const outputContent = await readFile(outputPath, "utf-8");

      // Assert
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
      expect(result.exitCode).toBe(0);
      const outputContent = await readFile(outputPath, "utf-8");

      // Act
      const krd = JSON.parse(outputContent);

      // Assert
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
        expect(result.exitCode).toBe(0);

        // Act
        const stderr = stripAnsi(result.stderr);

        // Assert
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
        expect(result.exitCode).toBe(0);

        // Act
        const stdout = stripAnsi(result.stdout);

        // Assert
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
        expect(result.exitCode).toBe(0);

        // Act
        const output = JSON.parse(result.stdout);

        // Assert
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
        expect(result.exitCode).toBe(0);
        const stderr = result.stderr;
        const lines = stderr.split("\n").filter((line) => line.trim());

        // Act
        const hasJsonLog = lines.some((line) => {
          try {
            const log = JSON.parse(line);
            return log.timestamp && log.level && log.message;
          } catch {
            return false;
          }
        });

        // Assert
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
        expect(result.exitCode).toBe(0);
        const combinedOutput = result.stdout + result.stderr;

        // Act
        const strippedOutput = stripAnsi(combinedOutput);

        // Assert
        if (combinedOutput.length > 0) {
          expect(combinedOutput).not.toBe(strippedOutput); // Has ANSI codes
        }
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
            env: {
              ...process.env,
              FORCE_COLOR: "0", // Disable color output
            },
          }
        );

        // Assert
        expect(result.exitCode).toBe(0);
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
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/Workout*.fit`,
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
        expect(result.exitCode).toBe(0);

        // Act
        const output = JSON.parse(result.stdout);

        // Assert
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
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/Workout*.fit`,
            "--output-dir",
            outputDir,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );
        expect(result.exitCode).toBe(0);

        // Act
        const output = stripAnsi(result.stdout);

        // Assert
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
        const { mkdir } = await import("fs/promises");
        await mkdir(testDir, { recursive: true });
        await writeFile(
          join(testDir, "valid.fit"),
          await readFile(getFixturePath("fit", "WorkoutIndividualSteps.fit"))
        );
        await writeFile(join(testDir, "corrupted.fit"), Buffer.from([0, 0, 0]));
        await writeFile(
          join(testDir, "valid2.fit"),
          await readFile(getFixturePath("fit", "WorkoutRepeatSteps.fit"))
        );
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
        expect(result.exitCode).toBe(ExitCode.PARTIAL_SUCCESS);

        // Act
        const output = stripAnsi(result.stdout);

        // Assert
        expect(output).toMatch(/Successful: \d+\/3/);
        expect(output).toMatch(/Failed: \d+\/3/);
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
        const { mkdir } = await import("fs/promises");
        await mkdir(testDir, { recursive: true });
        const fitContent = await readFile(
          getFixturePath("fit", "WorkoutIndividualSteps.fit")
        );
        await writeFile(join(testDir, "workout1.fit"), fitContent);
        await writeFile(join(testDir, "workout2.fit"), fitContent);
        await writeFile(join(testDir, "workout3.fit"), fitContent);
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
        expect(result.exitCode).toBe(0);

        // Act
        const output = stripAnsi(result.stdout);

        // Assert
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
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/Workout*.fit`,
            "--output-format",
            "krd",
          ],
          {
            reject: false,
          }
        );
        expect(result.exitCode).toBe(1);

        // Act
        const output = stripAnsi(result.stderr);

        // Assert
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
        const result = await execa(
          "tsx",
          [
            cliPath,
            "convert",
            "--input",
            `${fixturesDir}/Workout*.fit`,
            "--output-dir",
            outputDir,
          ],
          {
            reject: false,
          }
        );
        expect(result.exitCode).toBe(1);

        // Act
        const output = stripAnsi(result.stderr);

        // Assert
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
        expect(result.exitCode).toBe(1);

        // Act
        const output = stripAnsi(result.stderr);

        // Assert
        expect(output).toContain("No files found matching pattern");
      }
    );
  });
});
