import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";

describe("kaiord_convert", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-convert-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should convert KRD content to TCX", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: krdJson,
        input_format: "krd",
        output_format: "tcx",
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("TrainingCenterDatabase");
  });

  it("should convert KRD file to TCX", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "input.krd");
    await writeFile(filePath, krdJson);

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: { input_file: filePath, output_format: "tcx" },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("TrainingCenterDatabase");
  });

  it("should return error when both inputs provided", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_file: "/some/file.krd",
        input_content: "{}",
        input_format: "krd",
        output_format: "tcx",
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
  });

  it("should write FIT output to file", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const outPath = join(tmpDir, "output.fit");

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: krdJson,
        input_format: "krd",
        output_format: "fit",
        output_file: outPath,
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Written to:");
  });
});
