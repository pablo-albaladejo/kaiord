import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";

describe("kaiord_extract_workout", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-extract-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should extract workout from KRD content", async () => {
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    const result = (await client.callTool({
      name: "kaiord_extract_workout",
      arguments: { input_content: krdJson, input_format: "krd" },
    })) as McpToolResult;

    const workout = JSON.parse(result.content[0].text);
    expect(workout).toHaveProperty("steps");
  });

  it("should extract workout from KRD file", async () => {
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "workout.krd");
    await writeFile(filePath, krdJson);

    const result = (await client.callTool({
      name: "kaiord_extract_workout",
      arguments: { input_file: filePath },
    })) as McpToolResult;

    const workout = JSON.parse(result.content[0].text);
    expect(workout).toHaveProperty("steps");
  });

  it("should return error when both input_file and input_content provided", async () => {
    const client = await createTestClient();

    const result = (await client.callTool({
      name: "kaiord_extract_workout",
      arguments: {
        input_file: "/some/file.krd",
        input_content: "{}",
        input_format: "krd",
      },
    })) as McpToolResult;

    expect(result.isError).toBe(true);
  });
});
