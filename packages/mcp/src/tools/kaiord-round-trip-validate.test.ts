import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath } from "../tests/helpers/test-fixtures";

describe("kaiord_round_trip_validate", () => {
  it("should validate a FIT file round-trip successfully", async () => {
    // Arrange
    const client = await createTestClient();
    const fitPath = getFixturePath("fit", "WorkoutIndividualSteps.fit");

    // Act
    const result = (await client.callTool({
      name: "kaiord_round_trip_validate",
      arguments: { input_file: fitPath },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Round-trip validation");
  });

  it.each([
    "/tmp/nonexistent.fit",
    getFixturePath("krd", "WorkoutIndividualSteps.krd"),
  ])("should return error for invalid input: %s", async (inputFile) => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_round_trip_validate",
      arguments: { input_file: inputFile },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Error");
  });
});
