import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";

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
