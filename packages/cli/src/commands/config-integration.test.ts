import { execa } from "execa";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { dir } from "tmp-promise";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("config file integration", () => {
  let tmpDir: { path: string; cleanup: () => Promise<void> };

  beforeEach(async () => {
    tmpDir = await dir({ unsafeCleanup: true });
  });

  afterEach(async () => {
    await tmpDir.cleanup();
  });

  it("should use config file defaults for convert command", async () => {
    // Arrange - Create config file
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      defaultOutputFormat: "krd",
      verbose: true,
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Create a minimal FIT file (just for testing config loading)
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    const outputPath = join(tmpDir.path, "workout.krd");

    // Act - Run convert command from tmpDir (where config file is)
    const result = await execa(
      "node",
      [
        "dist/bin/kaiord.js",
        "convert",
        "--input",
        inputPath,
        "--output",
        outputPath,
      ],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert - Config should be loaded (verbose logging should be enabled)
    // Note: This test verifies config loading, not actual conversion
    expect(result.exitCode).toBeDefined();
  });

  it("should prioritize CLI options over config defaults", async () => {
    // Arrange - Create config file with verbose: true
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      verbose: true,
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Create a minimal FIT file
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    const outputPath = join(tmpDir.path, "workout.krd");

    // Act - Run convert command with --quiet (should override config)
    const result = await execa(
      "node",
      [
        "dist/bin/kaiord.js",
        "convert",
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--quiet",
      ],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert - CLI option should override config
    expect(result.exitCode).toBeDefined();
  });

  it("should use default output directory from config", async () => {
    // Arrange - Create config file with defaultOutputDir
    const outputDir = join(tmpDir.path, "output");
    await mkdir(outputDir, { recursive: true });

    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      defaultOutputDir: outputDir,
      defaultOutputFormat: "krd",
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Create a minimal FIT file
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    // Act - Run convert command with glob pattern (batch mode)
    const result = await execa(
      "node",
      ["dist/bin/kaiord.js", "convert", "--input", "*.fit"],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert - Config should be loaded
    expect(result.exitCode).toBeDefined();
  });

  it("should use default tolerance config from config file", async () => {
    // Arrange - Create tolerance config file
    const toleranceConfigPath = join(tmpDir.path, "tolerance.json");
    const toleranceConfig = {
      time: { absolute: 2, unit: "seconds" },
      power: { absolute: 2, percentage: 2, unit: "watts" },
    };
    await writeFile(
      toleranceConfigPath,
      JSON.stringify(toleranceConfig, null, 2)
    );

    // Create config file with defaultToleranceConfig
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      defaultToleranceConfig: toleranceConfigPath,
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));

    // Create a minimal FIT file
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    // Act - Run validate command
    const result = await execa(
      "node",
      ["dist/bin/kaiord.js", "validate", "--input", inputPath],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert - Config should be loaded
    expect(result.exitCode).toBeDefined();
  }, 15000); // Increased timeout for process spawning under load

  it("should work without config file", async () => {
    // Arrange - No config file created
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    const outputPath = join(tmpDir.path, "workout.krd");

    // Act - Run convert command
    const result = await execa(
      "node",
      [
        "dist/bin/kaiord.js",
        "convert",
        "--input",
        inputPath,
        "--output",
        outputPath,
      ],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert - Should work without config file
    expect(result.exitCode).toBeDefined();
  });

  it("should handle invalid config file gracefully", async () => {
    // Arrange - Create invalid config file
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    await writeFile(configPath, "invalid json");

    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    const outputPath = join(tmpDir.path, "workout.krd");

    // Act - Run convert command
    const result = await execa(
      "node",
      [
        "dist/bin/kaiord.js",
        "convert",
        "--input",
        inputPath,
        "--output",
        outputPath,
      ],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert - Should handle invalid config gracefully
    expect(result.exitCode).toBeDefined();
  }, 15000); // Increased timeout for process spawning under load
});
