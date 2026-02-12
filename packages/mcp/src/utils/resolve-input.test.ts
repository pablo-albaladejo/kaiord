import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveTextInput, validateExclusiveInput } from "./resolve-input";

describe("validateExclusiveInput", () => {
  it("should throw when both inputs are missing", () => {
    expect(() => validateExclusiveInput(undefined, undefined)).toThrow(
      "Provide either input_file or input_content"
    );
  });

  it("should throw when both inputs are provided", () => {
    expect(() => validateExclusiveInput("file.krd", "{}")).toThrow(
      "Provide only one of input_file or input_content"
    );
  });

  it("should accept only input_file", () => {
    expect(() => validateExclusiveInput("file.krd", undefined)).not.toThrow();
  });

  it("should accept only input_content", () => {
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
    const result = await resolveTextInput(undefined, '{"valid":"json"}');

    expect(result).toBe('{"valid":"json"}');
  });

  it("should read file when input_file is provided", async () => {
    const filePath = join(tempDir, "test.krd");
    await writeFile(filePath, '{"test":"data"}', "utf-8");

    const result = await resolveTextInput(filePath, undefined);

    expect(result).toBe('{"test":"data"}');
  });

  it("should throw when neither input is provided", async () => {
    await expect(resolveTextInput(undefined, undefined)).rejects.toThrow(
      "Provide either input_file or input_content"
    );
  });
});
