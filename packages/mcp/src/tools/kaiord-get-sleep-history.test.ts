import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

describe("kaiord_get_sleep_history", () => {
  let dir: string | undefined;

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("should return both sleep records sorted ascending", async () => {
    // Arrange
    const client = await createTestClient();
    const inputs = [
      getFixturePath("fit", "HealthSleepFullNight.fit"),
      getFixturePath("fit", "HealthSleepOvernight.fit"),
    ];

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_sleep_history",
      arguments: { input_files: inputs },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      records: Array<{ startTime: string }>;
      total: number;
      skipped: number;
    };
    expect(parsed.records).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.skipped).toBe(0);
    expect(parsed.records[0].startTime <= parsed.records[1].startTime).toBe(
      true
    );
  });

  it("should report skipped count for invalid file paths", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_sleep_history",
      arguments: { input_files: ["/nonexistent/file.fit"] },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as { skipped: number };
    expect(parsed.skipped).toBe(1);
  });

  it("should leave a sleep KRD without a sleep entry out of total", async () => {
    // Arrange
    const client = await createTestClient();
    dir = await mkdtemp(join(tmpdir(), "mcp-sleep-history-"));
    const emptyKrd = join(dir, "empty-sleep.krd");
    await writeFile(
      emptyKrd,
      JSON.stringify({
        version: "2.0",
        type: "sleep_record",
        metadata: { created: "2026-05-22T07:00:00.000Z" },
      })
    );
    const inputs = [
      getFixturePath("fit", "HealthSleepFullNight.fit"),
      emptyKrd,
    ];

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_sleep_history",
      arguments: { input_files: inputs },
    })) as McpToolResult;

    // Assert
    const parsed = JSON.parse(result.content[0].text) as {
      records: Array<unknown>;
      total: number;
      skipped: number;
    };
    expect(parsed.skipped).toBe(0);
    expect(parsed.records).toHaveLength(1);
    expect(parsed.total).toBe(1);
  });
});
