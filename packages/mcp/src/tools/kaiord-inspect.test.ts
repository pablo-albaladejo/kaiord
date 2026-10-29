import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import {
  getFixturePath,
  loadFitFixture,
  loadKrdFixtureRaw,
} from "../tests/helpers/test-fixtures";
import { encodeBase64 } from "../utils/base64";

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

  it("should return the same summary for inline base64 FIT, locally and remotely", async () => {
    // Arrange
    const fitPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");
    const input_content = encodeBase64(
      loadFitFixture("WorkoutIndividualSteps.fit")
    );
    const local = await createTestClient();
    const remote = await createRemoteTestClient();

    // Act
    const fromFile = (await local.callTool({
      name: "kaiord_inspect",
      arguments: { input_file: fitPath },
    })) as McpToolResult;
    const fromContent = (await remote.callTool({
      name: "kaiord_inspect",
      arguments: { input_content, input_format: "fit" },
    })) as McpToolResult;

    // Assert
    expect(fromContent.isError).toBeUndefined();
    expect(fromContent.content[0].text).toBe(fromFile.content[0].text);
  });

  it.each([
    [{}, "Provide either input_file or input_content"],
    [{ input_file: "a.krd", input_content: "{}" }, "Provide only one of"],
  ])("should enforce path/content exclusivity %#", async (args, message) => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_inspect",
      arguments: args,
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(message);
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
