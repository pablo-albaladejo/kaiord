import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

describe("kaiord_get_health_summary", () => {
  it("should expose latest sleep weight and hrv from fixtures", async () => {
    // Arrange
    const client = await createTestClient();
    const inputs = [
      getFixturePath("fit", "HealthSleepFullNight.fit"),
      getFixturePath("fit", "WeightScaleSingleUser.fit"),
      getFixturePath("fit", "HealthHrvOvernight.fit"),
    ];

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_health_summary",
      arguments: { input_files: inputs },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      latest: {
        sleep?: unknown;
        weight?: unknown;
        hrv?: unknown;
      };
      counts: { sleep: number; weight: number; hrv: number };
      skipped: number;
    };
    expect(parsed.latest.sleep).toBeDefined();
    expect(parsed.latest.weight).toBeDefined();
    expect(parsed.latest.hrv).toBeDefined();
    expect(parsed.counts.sleep).toBe(1);
    expect(parsed.counts.weight).toBe(1);
    expect(parsed.counts.hrv).toBe(1);
    expect(parsed.skipped).toBe(0);
  });

  it("should report skipped count for invalid file paths", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_health_summary",
      arguments: { input_files: ["/nonexistent/file.fit"] },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as { skipped: number };
    expect(parsed.skipped).toBe(1);
  });
});
