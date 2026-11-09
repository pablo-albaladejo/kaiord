import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

describe("kaiord_get_weight_history", () => {
  it("should return both weight records sorted ascending", async () => {
    // Arrange
    const client = await createTestClient();
    const inputs = [
      getFixturePath("fit", "WeightScaleSingleUser.fit"),
      getFixturePath("fit", "WeightScaleMultiUser.fit"),
    ];

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_weight_history",
      arguments: { input_files: inputs },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      records: Array<{ measuredAt: string }>;
      total: number;
      skipped: number;
    };
    expect(parsed.records).toHaveLength(2);
    expect(parsed.total).toBe(2);
    expect(parsed.skipped).toBe(0);
    expect(parsed.records[0].measuredAt <= parsed.records[1].measuredAt).toBe(
      true
    );
  });

  it("should report skipped count for invalid file paths", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_weight_history",
      arguments: { input_files: ["/nonexistent/file.fit"] },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as { skipped: number };
    expect(parsed.skipped).toBe(1);
  });
});
