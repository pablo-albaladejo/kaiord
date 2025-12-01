import { readFile } from "fs/promises";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configSchema, loadConfig, mergeWithConfig } from "./config-loader";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

// Mock os
vi.mock("os", () => ({
  homedir: vi.fn(() => "/home/user"),
}));

describe("configSchema", () => {
  it("should validate valid config", () => {
    // Arrange
    const validConfig = {
      defaultInputFormat: "fit",
      defaultOutputFormat: "krd",
      defaultOutputDir: "./output",
      defaultToleranceConfig: "./tolerance.json",
      verbose: true,
      quiet: false,
      json: false,
      logFormat: "pretty",
    };

    // Act
    const result = configSchema.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should validate empty config", () => {
    // Arrange
    const emptyConfig = {};

    // Act
    const result = configSchema.safeParse(emptyConfig);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should reject invalid format", () => {
    // Arrange
    const invalidConfig = {
      defaultInputFormat: "invalid",
    };

    // Act
    const result = configSchema.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
  });

  it("should reject invalid logFormat", () => {
    // Arrange
    const invalidConfig = {
      logFormat: "invalid",
    };

    // Act
    const result = configSchema.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("loadConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should load config from current directory", async () => {
    // Arrange
    const mockConfig = {
      defaultInputFormat: "fit",
      defaultOutputFormat: "krd",
    };

    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(mockConfig));

    // Act
    const config = await loadConfig();

    // Assert
    expect(config).toEqual(mockConfig);
    expect(readFile).toHaveBeenCalledWith(
      join(process.cwd(), ".kaiordrc.json"),
      "utf-8"
    );
  });

  it("should load config from home directory if not in current directory", async () => {
    // Arrange
    const mockConfig = {
      defaultOutputDir: "./output",
    };

    vi.mocked(readFile)
      .mockRejectedValueOnce(new Error("File not found"))
      .mockResolvedValueOnce(JSON.stringify(mockConfig));

    // Act
    const config = await loadConfig();

    // Assert
    expect(config).toEqual(mockConfig);
    expect(readFile).toHaveBeenCalledWith(
      join(process.cwd(), ".kaiordrc.json"),
      "utf-8"
    );
    expect(readFile).toHaveBeenCalledWith(
      join("/home/user", ".kaiordrc.json"),
      "utf-8"
    );
  });

  it("should return empty config if no config file found", async () => {
    // Arrange
    vi.mocked(readFile).mockRejectedValue(new Error("File not found"));

    // Act
    const config = await loadConfig();

    // Assert
    expect(config).toEqual({});
  });

  it("should return empty config if config file is invalid JSON", async () => {
    // Arrange
    vi.mocked(readFile).mockResolvedValue("invalid json");

    // Act
    const config = await loadConfig();

    // Assert
    expect(config).toEqual({});
  });

  it("should return empty config if config file fails schema validation", async () => {
    // Arrange
    const invalidConfig = {
      defaultInputFormat: "invalid-format",
    };

    vi.mocked(readFile).mockResolvedValue(JSON.stringify(invalidConfig));

    // Act
    const config = await loadConfig();

    // Assert
    expect(config).toEqual({});
  });
});

describe("mergeWithConfig", () => {
  it("should merge CLI options with config defaults", () => {
    // Arrange
    const cliOptions = {
      input: "workout.fit",
      output: "workout.krd",
    };

    const config = {
      defaultOutputDir: "./output",
      verbose: true,
    };

    // Act
    const merged = mergeWithConfig(cliOptions, config);

    // Assert
    expect(merged).toEqual({
      input: "workout.fit",
      output: "workout.krd",
      defaultOutputDir: "./output",
      verbose: true,
    });
  });

  it("should prioritize CLI options over config defaults", () => {
    // Arrange
    const cliOptions = {
      verbose: false,
      outputDir: "./custom",
    };

    const config = {
      verbose: true,
      defaultOutputDir: "./output",
    };

    // Act
    const merged = mergeWithConfig(cliOptions, config);

    // Assert
    expect(merged.verbose).toBe(false);
    expect(merged.outputDir).toBe("./custom");
  });

  it("should remove undefined CLI options to allow config defaults", () => {
    // Arrange
    const cliOptions = {
      input: "workout.fit",
      output: undefined,
      verbose: undefined,
    };

    const config = {
      defaultOutputFormat: "krd",
      verbose: true,
    };

    // Act
    const merged = mergeWithConfig(cliOptions, config);

    // Assert
    expect(merged).toEqual({
      input: "workout.fit",
      defaultOutputFormat: "krd",
      verbose: true,
    });
    expect(merged.output).toBeUndefined();
  });

  it("should handle empty config", () => {
    // Arrange
    const cliOptions = {
      input: "workout.fit",
      output: "workout.krd",
    };

    const config = {};

    // Act
    const merged = mergeWithConfig(cliOptions, config);

    // Assert
    expect(merged).toEqual({
      input: "workout.fit",
      output: "workout.krd",
    });
  });
});
