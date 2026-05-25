import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

describe("kaiord_get_sleep_history", () => {
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
});
