import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";

describe("kaiord_inspect", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-inspect-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should return a summary for a KRD file detected by extension", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "test.krd");
    await writeFile(filePath, krdJson);

    // Act
    const result = (await client.callTool({
      name: "kaiord_inspect",
      arguments: { input_file: filePath },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Type:");
    expect(result.content[0].text).toContain("Sport:");
  });

  it("should return error for non-existent file", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_inspect",
      arguments: { input_file: "/nonexistent/path.krd" },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
  });
});
