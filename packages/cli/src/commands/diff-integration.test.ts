import { execa } from "execa";
import { dirname, join, resolve } from "path";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { ExitCode } from "../utils/exit-codes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_PATH = resolve(__dirname, "../../dist/bin/kaiord.js");
const FIXTURES_PATH = resolve(__dirname, "../../../../test-fixtures");
const INTEGRATION_TIMEOUT = 15_000; // Increased timeout for process spawning under load

describe("diff command integration", () => {
  it(
    "should show files are identical when comparing same file",
    async () => {
      // Arrange
      const fixturePath = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");

      // Act
      const { stdout, exitCode } = await execa("node", [
        CLI_PATH,
        "diff",
        "--file1",
        fixturePath,
        "--file2",
        fixturePath,
      ]);

      // Assert
      expect(exitCode).toBe(0);
      const output = stripAnsi(stdout);
      expect(output).toContain("Files are identical");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should show differences when comparing different files",
    async () => {
      // Arrange
      const file1 = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const file2 = join(FIXTURES_PATH, "fit/WorkoutRepeatSteps.fit");

      // Act - use reject: false to capture non-zero exit codes
      const { stdout, exitCode } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", file1, "--file2", file2],
        { reject: false }
      );

      // Assert
      // Exit code 0 = identical, 10 = differences found (not an error)
      expect([ExitCode.SUCCESS, ExitCode.DIFFERENCES_FOUND]).toContain(
        exitCode
      );
      const output = stripAnsi(stdout);
      expect(output).toBeTruthy();
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should output JSON format when --json flag is used",
    async () => {
      // Arrange
      const fixturePath = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");

      // Act
      const { stdout, exitCode } = await execa("node", [
        CLI_PATH,
        "diff",
        "--file1",
        fixturePath,
        "--file2",
        fixturePath,
        "--json",
      ]);

      // Assert
      expect(exitCode).toBe(0);
      const result = JSON.parse(stdout);
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("identical", true);
      expect(result).toHaveProperty("file1");
      expect(result).toHaveProperty("file2");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should handle missing file error",
    async () => {
      // Arrange
      const validFile = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const missingFile = join(FIXTURES_PATH, "nonexistent.fit");

      // Act & Assert
      await expect(
        execa("node", [
          CLI_PATH,
          "diff",
          "--file1",
          validFile,
          "--file2",
          missingFile,
        ])
      ).rejects.toThrow();
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should support format override flags",
    async () => {
      // Arrange
      const fixturePath = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");

      // Act
      const { stdout, exitCode } = await execa("node", [
        CLI_PATH,
        "diff",
        "--file1",
        fixturePath,
        "--file2",
        fixturePath,
        "--format1",
        "fit",
        "--format2",
        "fit",
      ]);

      // Assert
      expect(exitCode).toBe(0);
      const output = stripAnsi(stdout);
      expect(output).toContain("Files are identical");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should compare files of different formats",
    async () => {
      // Arrange
      const fitFile = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const krdFile = join(FIXTURES_PATH, "krd/WorkoutIndividualSteps.krd");

      // Act - use reject: false to capture non-zero exit codes
      const { stdout, exitCode } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", fitFile, "--file2", krdFile],
        { reject: false }
      );

      // Assert
      // Exit code 0 = identical, 10 = differences found (not an error)
      expect([ExitCode.SUCCESS, ExitCode.DIFFERENCES_FOUND]).toContain(
        exitCode
      );
      const output = stripAnsi(stdout);
      expect(output).toBeTruthy();
    },
    INTEGRATION_TIMEOUT
  );
});
