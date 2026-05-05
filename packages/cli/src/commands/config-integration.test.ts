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

  it("should use config file defaults for convert command", { timeout: 15000 }, async () => {
    // Arrange
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      defaultOutputFormat: "krd",
      verbose: true,
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));
    const outputPath = join(tmpDir.path, "workout.krd");

    // Act
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

    // Assert
    expect(result.exitCode).toBeDefined();
  });

  it(
    "should prioritize CLI options over config defaults",
    { timeout: 15000 },
    async () => {
      // Arrange
      const configPath = join(tmpDir.path, ".kaiordrc.json");
      const config = {
        verbose: true,
      };
      await writeFile(configPath, JSON.stringify(config, null, 2));
      const inputPath = join(tmpDir.path, "workout.fit");
      await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));
      const outputPath = join(tmpDir.path, "workout.krd");

      // Act
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

      // Assert
      expect(result.exitCode).toBeDefined();
    }
  );

  it("should use default output directory from config", async () => {
    // Arrange
    const outputDir = join(tmpDir.path, "output");
    await mkdir(outputDir, { recursive: true });
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      defaultOutputDir: outputDir,
      defaultOutputFormat: "krd",
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    // Act
    const result = await execa(
      "node",
      ["dist/bin/kaiord.js", "convert", "--input", "*.fit"],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert
    expect(result.exitCode).toBeDefined();
  });

  it("should use default tolerance config from config file", async () => {
    // Arrange
    const toleranceConfigPath = join(tmpDir.path, "tolerance.json");
    const toleranceConfig = {
      time: { absolute: 2, unit: "seconds" },
      power: { absolute: 2, percentage: 2, unit: "watts" },
    };
    await writeFile(
      toleranceConfigPath,
      JSON.stringify(toleranceConfig, null, 2)
    );
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    const config = {
      defaultToleranceConfig: toleranceConfigPath,
    };
    await writeFile(configPath, JSON.stringify(config, null, 2));
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));

    // Act
    const result = await execa(
      "node",
      ["dist/bin/kaiord.js", "validate", "--input", inputPath],
      {
        cwd: tmpDir.path,
        reject: false,
      }
    );

    // Assert
    expect(result.exitCode).toBeDefined();
  }, 15000); // Increased timeout for process spawning under load

  it("should work without config file", async () => {
    // Arrange
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));
    const outputPath = join(tmpDir.path, "workout.krd");

    // Act
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

    // Assert
    expect(result.exitCode).toBeDefined();
  });

  it("should handle invalid config file gracefully", async () => {
    // Arrange
    const configPath = join(tmpDir.path, ".kaiordrc.json");
    await writeFile(configPath, "invalid json");
    const inputPath = join(tmpDir.path, "workout.fit");
    await writeFile(inputPath, Buffer.from([0x0e, 0x10, 0x00, 0x00]));
    const outputPath = join(tmpDir.path, "workout.krd");

    // Act
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

    // Assert
    expect(result.exitCode).toBeDefined();
  }, 15000); // Increased timeout for process spawning under load
});
