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
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_content: krdJson },
    })) as McpToolResult;

    expect(result.content[0].text).toContain("Valid KRD document");
  });

  it("should validate valid KRD file", async () => {
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "test.krd");
    await writeFile(filePath, krdJson);

    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_file: filePath },
    })) as McpToolResult;

    expect(result.content[0].text).toContain("Valid KRD document");
  });

  it("should return error for invalid JSON", async () => {
    const client = await createTestClient();

    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_content: "not json" },
    })) as McpToolResult;

    expect(result.isError).toBe(true);
  });

  it("should return error for schema mismatch", async () => {
    const client = await createTestClient();

    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_content: '{"foo": "bar"}' },
    })) as McpToolResult;

    expect(result.isError).toBe(true);
  });
});
