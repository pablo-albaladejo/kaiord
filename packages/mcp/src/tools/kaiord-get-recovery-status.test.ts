import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

const VALID_STATUSES = ["ready", "moderate", "fatigued", "unknown"] as const;

describe("kaiord_get_recovery_status", () => {
  it("should derive a status with basedOn timestamps from sleep and hrv", async () => {
    // Arrange
    const client = await createTestClient();
    const inputs = [
      getFixturePath("fit", "HealthSleepFullNight.fit"),
      getFixturePath("fit", "HealthHrvOvernight.fit"),
    ];

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_recovery_status",
      arguments: { input_files: inputs },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      status: string;
      reason: string;
      basedOn: { hrvAt?: string; sleepAt?: string };
    };
    expect(VALID_STATUSES).toContain(parsed.status);
    expect(typeof parsed.reason).toBe("string");
    expect(parsed.basedOn.hrvAt).toBeDefined();
    expect(parsed.basedOn.sleepAt).toBeDefined();
  });

  it("should report unknown status when all input files are skipped", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_recovery_status",
      arguments: { input_files: ["/nonexistent/file.fit"] },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text) as {
      status: string;
      basedOn: { hrvAt?: string; sleepAt?: string };
    };
    expect(parsed.status).toBe("unknown");
    expect(parsed.basedOn.hrvAt).toBeUndefined();
    expect(parsed.basedOn.sleepAt).toBeUndefined();
  });
});
