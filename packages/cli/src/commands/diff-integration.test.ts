import { execa } from "execa";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
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
      const { stdout, exitCode } = await execa("node", [
        CLI_PATH,
        "diff",
        "--file1",
        fixturePath,
        "--file2",
        fixturePath,
      ]);
      expect(exitCode).toBe(0);

      // Act
      const output = stripAnsi(stdout);

      // Assert
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
      const { stdout, exitCode } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", file1, "--file2", file2],
        { reject: false }
      );
      expect(exitCode).toBe(ExitCode.DIFFERENCES_FOUND);

      // Act
      const output = stripAnsi(stdout);

      // Assert
      expect(output).toContain("Workout Steps Differences:");
      expect(output).toContain("Step count: 4 vs 3");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should output JSON format when --json flag is used",
    async () => {
      // Arrange
      const fixturePath = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const { stdout, exitCode } = await execa("node", [
        CLI_PATH,
        "diff",
        "--file1",
        fixturePath,
        "--file2",
        fixturePath,
        "--json",
      ]);
      expect(exitCode).toBe(0);

      // Act
      const result = JSON.parse(stdout);

      // Assert
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("identical", true);
      expect(result).toHaveProperty("file1");
      expect(result).toHaveProperty("file2");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should exit with FILE_NOT_FOUND when a file is missing",
    async () => {
      // Arrange
      const validFile = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const missingFile = join(FIXTURES_PATH, "nonexistent.fit");

      // Act
      const { stdout, stderr, exitCode } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", validFile, "--file2", missingFile],
        { reject: false }
      );

      // Assert
      expect(exitCode).toBe(ExitCode.FILE_NOT_FOUND);
      expect(stdout).toBe("");
      expect(stripAnsi(stderr)).toContain("File not found");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should report the missing file as a JSON error with FILE_NOT_FOUND",
    async () => {
      // Arrange
      const validFile = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const missingFile = join(FIXTURES_PATH, "nonexistent.fit");

      // Act
      const { stdout, exitCode } = await execa(
        "node",
        [
          CLI_PATH,
          "diff",
          "--file1",
          validFile,
          "--file2",
          missingFile,
          "--json",
        ],
        { reject: false }
      );

      // Assert
      expect(exitCode).toBe(ExitCode.FILE_NOT_FOUND);
      const result = JSON.parse(stdout);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain("File not found");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should exit with INVALID_ARGUMENT when the file format is unsupported",
    async () => {
      // Arrange
      const validFile = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
      const unsupported = join(FIXTURES_PATH, "README.md");

      // Act
      const { exitCode, stderr } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", validFile, "--file2", unsupported],
        { reject: false }
      );

      // Assert
      expect(exitCode).toBe(ExitCode.INVALID_ARGUMENT);
      expect(stripAnsi(stderr)).toContain("Unable to detect format");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should exit with VALIDATION_ERROR when a file is not a valid KRD",
    async () => {
      // Arrange
      const validFile = join(FIXTURES_PATH, "krd/WorkoutIndividualSteps.krd");
      const dir = await mkdtemp(join(tmpdir(), "kaiord-diff-"));
      const invalid = join(dir, "bad.krd");
      await writeFile(invalid, '{"not":"krd"}');

      // Act
      const { exitCode, stderr } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", validFile, "--file2", invalid],
        { reject: false }
      );
      await rm(dir, { recursive: true, force: true });

      // Assert
      expect(exitCode).toBe(ExitCode.VALIDATION_ERROR);
      expect(stripAnsi(stderr)).toContain("Invalid KRD format");
    },
    INTEGRATION_TIMEOUT
  );

  it(
    "should support format override flags",
    async () => {
      // Arrange
      const fixturePath = join(FIXTURES_PATH, "fit/WorkoutIndividualSteps.fit");
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
      expect(exitCode).toBe(0);

      // Act
      const output = stripAnsi(stdout);

      // Assert
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
      const { stdout, exitCode } = await execa(
        "node",
        [CLI_PATH, "diff", "--file1", fitFile, "--file2", krdFile],
        { reject: false }
      );
      expect(exitCode).toBe(ExitCode.DIFFERENCES_FOUND);

      // Act
      const output = stripAnsi(stdout);

      // Assert
      expect(output).toContain("Metadata Differences:");
    },
    INTEGRATION_TIMEOUT
  );
});
