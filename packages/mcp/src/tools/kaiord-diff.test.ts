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
  loadFitFixture,
  loadKrdFixtureRaw,
} from "../tests/helpers/test-fixtures";
import { encodeBase64 } from "../utils/base64";

describe("kaiord_diff", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-diff-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should detect metadata differences", async () => {
    // Arrange
    const client = await createTestClient();
    const krd1 = JSON.parse(loadKrdFixtureRaw("WorkoutIndividualSteps.krd"));
    const krd2 = { ...krd1, metadata: { ...krd1.metadata, sport: "running" } };
    const file1 = join(tmpDir, "a.krd");
    const file2 = join(tmpDir, "b.krd");
    await writeFile(file1, JSON.stringify(krd1));
    await writeFile(file2, JSON.stringify(krd2));

    // Act
    const result = (await client.callTool({
      name: "kaiord_diff",
      arguments: { file1, file2 },
    })) as McpToolResult;
    const diff = JSON.parse(result.content[0].text);
    const sportDiff = diff.metadata.find(
      (d: { field: string }) => d.field === "sport"
    );

    // Assert
    expect(diff.metadata.length).toBeGreaterThan(0);
    expect(sportDiff).toBeDefined();
  });

  it("should diff inline content against a file and remotely inline against inline", async () => {
    // Arrange
    const krd1 = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const fit2 = encodeBase64(loadFitFixture("WorkoutRepeatSteps.fit"));
    const file2 = join(tmpDir, "b.krd");
    await writeFile(file2, loadKrdFixtureRaw("WorkoutRepeatSteps.krd"));
    const local = await createTestClient();
    const remote = await createRemoteTestClient();

    // Act
    const mixed = (await local.callTool({
      name: "kaiord_diff",
      arguments: { content1: krd1, format1: "krd", file2 },
    })) as McpToolResult;
    const inline = (await remote.callTool({
      name: "kaiord_diff",
      arguments: {
        content1: krd1,
        format1: "krd",
        content2: fit2,
        format2: "fit",
      },
    })) as McpToolResult;

    // Assert
    expect(mixed.isError).toBeUndefined();
    expect(inline.isError).toBeUndefined();
    expect(
      JSON.parse(inline.content[0].text).steps.diffs.length
    ).toBeGreaterThan(0);
  });

  it.each([
    [{ content2: "{}" }, "Provide either file1 or content1"],
    [
      { file1: "a.krd", content1: "{}", content2: "{}" },
      "Provide only one of file1 or content1",
    ],
    [{ content1: "{}" }, "Provide either file2 or content2"],
    [
      { content1: "{}", file2: "b.krd", content2: "{}" },
      "Provide only one of file2 or content2",
    ],
  ])(
    "should enforce path/content exclusivity per side %#",
    async (args, message) => {
      // Arrange
      const client = await createTestClient();

      // Act
      const result = (await client.callTool({
        name: "kaiord_diff",
        arguments: args,
      })) as McpToolResult;

      // Assert
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(message);
    }
  );

  it("should return error for non-existent file", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_diff",
      arguments: { file1: "/nonexistent/a.krd", file2: "/nonexistent/b.krd" },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
  });
});
