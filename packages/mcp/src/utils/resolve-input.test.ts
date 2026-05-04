import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveTextInput, validateExclusiveInput } from "./resolve-input";

describe("validateExclusiveInput", () => {
  it("should throw when both inputs are missing", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validateExclusiveInput(undefined, undefined)).toThrow(
      "Provide either input_file or input_content"
    );
  });

  it("should throw when both inputs are provided", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validateExclusiveInput("file.krd", "{}")).toThrow(
      "Provide only one of input_file or input_content"
    );
  });

  it("should accept only input_file", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validateExclusiveInput("file.krd", undefined)).not.toThrow();
  });

  it("should accept only input_content", () => {
    // Arrange

    // Act

    // Assert
    expect(() => validateExclusiveInput(undefined, "{}")).not.toThrow();
  });
});

describe("resolveTextInput", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "mcp-resolve-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should return content when input_content is provided", async () => {
    // Arrange

    // Act
    const result = await resolveTextInput(undefined, '{"valid":"json"}');

    // Assert
    expect(result).toBe('{"valid":"json"}');
  });

  it("should read file when input_file is provided", async () => {
    // Arrange
    const filePath = join(tempDir, "test.krd");
    await writeFile(filePath, '{"test":"data"}', "utf-8");

    // Act
    const result = await resolveTextInput(filePath, undefined);

    // Assert
    expect(result).toBe('{"test":"data"}');
  });

  it("should throw when neither input is provided", async () => {
    // Arrange

    // Act

    // Assert
    await expect(resolveTextInput(undefined, undefined)).rejects.toThrow(
      "Provide either input_file or input_content"
    );
  });
});
