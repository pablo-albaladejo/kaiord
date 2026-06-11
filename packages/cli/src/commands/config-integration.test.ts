import { execa } from "execa";
import { readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import stripAnsi from "strip-ansi";
import { dir } from "tmp-promise";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getFixturePath, getFixturesDir } from "../tests/helpers/fixture-paths";

const PROCESS_TIMEOUT_MS = 30_000;
const CLI_PATH = resolve(__dirname, "../bin/kaiord.ts");
const FIT_FIXTURE = getFixturePath("fit", "WorkoutIndividualSteps.fit");

// The CLI discovers `.kaiordrc.json` from process.cwd(), so every spawn sets
// `cwd` to the temp directory that holds the config under test.
const runConvert = (cwd: string, args: Array<string>) =>
  execa("tsx", [CLI_PATH, "convert", ...args], { cwd, reject: false });

describe("config file integration", () => {
  let tmpDir: { path: string; cleanup: () => Promise<void> };

  beforeEach(async () => {
    tmpDir = await dir({ unsafeCleanup: true });
  });

  afterEach(async () => {
    await tmpDir.cleanup();
  });

  it(
    "should apply defaultOutputFormat from config when the output extension is unknown",
    { timeout: PROCESS_TIMEOUT_MS },
    async () => {
      // Arrange
      const configPath = join(tmpDir.path, ".kaiordrc.json");
      await writeFile(
        configPath,
        JSON.stringify({ defaultOutputFormat: "krd" })
      );
      // ".dat" is not auto-detectable, so the format can only come from config.
      const outputPath = join(tmpDir.path, "workout.dat");

      // Act
      const result = await runConvert(tmpDir.path, [
        "--input",
        FIT_FIXTURE,
        "--output",
        outputPath,
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
      const krd = JSON.parse(await readFile(outputPath, "utf-8"));
      expect(krd.type).toBe("structured_workout");
    }
  );

  it(
    "should emit debug logs when verbose is enabled via config",
    { timeout: PROCESS_TIMEOUT_MS },
    async () => {
      // Arrange
      const configPath = join(tmpDir.path, ".kaiordrc.json");
      await writeFile(configPath, JSON.stringify({ verbose: true }));
      const outputPath = join(tmpDir.path, "workout.krd");

      // Act
      const result = await runConvert(tmpDir.path, [
        "--input",
        FIT_FIXTURE,
        "--output",
        outputPath,
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
      expect(stripAnsi(result.stderr)).toContain("Convert command initialized");
    }
  );

  it(
    "should let the CLI --quiet flag override the config verbose default",
    { timeout: PROCESS_TIMEOUT_MS },
    async () => {
      // Arrange
      const configPath = join(tmpDir.path, ".kaiordrc.json");
      await writeFile(configPath, JSON.stringify({ verbose: true }));
      const outputPath = join(tmpDir.path, "workout.krd");

      // Act
      const result = await runConvert(tmpDir.path, [
        "--input",
        FIT_FIXTURE,
        "--output",
        outputPath,
        "--quiet",
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
      expect(stripAnsi(result.stderr)).not.toContain(
        "Convert command initialized"
      );
    }
  );

  it(
    "should write batch output into defaultOutputDir from config",
    { timeout: PROCESS_TIMEOUT_MS },
    async () => {
      // Arrange
      const outputDir = join(tmpDir.path, "configured-output");
      const configPath = join(tmpDir.path, ".kaiordrc.json");
      await writeFile(
        configPath,
        JSON.stringify({
          defaultOutputDir: outputDir,
          defaultOutputFormat: "krd",
        })
      );
      // The wildcard triggers batch mode, which is the only mode that reads
      // defaultOutputDir; the pattern matches exactly one fixture file.
      const inputGlob = `${getFixturesDir("fit")}/WorkoutIndividualStep*.fit`;

      // Act
      const result = await runConvert(tmpDir.path, ["--input", inputGlob]);

      // Assert
      expect(result.exitCode).toBe(0);
      const written = await readFile(
        join(outputDir, "WorkoutIndividualSteps.krd"),
        "utf-8"
      );
      expect(JSON.parse(written).type).toBe("structured_workout");
    }
  );

  it(
    "should report no configuration file found when none is present",
    { timeout: PROCESS_TIMEOUT_MS },
    async () => {
      // Arrange
      const outputPath = join(tmpDir.path, "workout.krd");

      // Act
      const result = await runConvert(tmpDir.path, [
        "--input",
        FIT_FIXTURE,
        "--output",
        outputPath,
        "--verbose",
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
      expect(stripAnsi(result.stderr)).toContain("No configuration file found");
    }
  );

  it(
    "should still convert successfully when the config file is malformed JSON",
    { timeout: PROCESS_TIMEOUT_MS },
    async () => {
      // Arrange
      const configPath = join(tmpDir.path, ".kaiordrc.json");
      await writeFile(configPath, "{ not valid json");
      const outputPath = join(tmpDir.path, "workout.krd");

      // Act
      const result = await runConvert(tmpDir.path, [
        "--input",
        FIT_FIXTURE,
        "--output",
        outputPath,
        "--verbose",
      ]);

      // Assert
      expect(result.exitCode).toBe(0);
      const krd = JSON.parse(await readFile(outputPath, "utf-8"));
      expect(krd.type).toBe("structured_workout");
    }
  );
});
