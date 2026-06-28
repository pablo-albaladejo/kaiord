import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";

describe("kaiord_validate", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-validate-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should validate valid KRD content", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Act
    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_content: krdJson },
    })) as McpToolResult;

    // Assert
    expect(result.content[0].text).toContain("Valid KRD document");
  });

  it("should validate valid KRD file", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "test.krd");
    await writeFile(filePath, krdJson);

    // Act
    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_file: filePath },
    })) as McpToolResult;

    // Assert
    expect(result.content[0].text).toContain("Valid KRD document");
  });

  it.each(["not json", '{"foo": "bar"}'])(
    "should return error for invalid input: %s",
    async (inputContent) => {
      // Arrange
      const client = await createTestClient();

      // Act
      const result = (await client.callTool({
        name: "kaiord_validate",
        arguments: { input_content: inputContent },
      })) as McpToolResult;

      // Assert
      expect(result.isError).toBe(true);
    }
  );
});
