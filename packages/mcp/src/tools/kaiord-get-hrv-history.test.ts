import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

describe("kaiord_get_hrv_history", () => {
  it("should return the hrv record from the fixture", async () => {
    // Arrange
    const client = await createTestClient();
    const inputs = [getFixturePath("fit", "HealthHrvOvernight.fit")];

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_hrv_history",
      arguments: { input_files: inputs },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      records: Array<{ measuredAt: string }>;
      total: number;
      skipped: number;
    };
    expect(parsed.records).toHaveLength(1);
    expect(parsed.total).toBe(1);
    expect(parsed.skipped).toBe(0);
  });
});
