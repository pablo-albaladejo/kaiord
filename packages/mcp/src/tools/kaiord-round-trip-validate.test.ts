import { describe, expect, it } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { getFixturePath, loadFitFixture } from "../tests/helpers/test-fixtures";
import { encodeBase64 } from "../utils/base64";
import { formatViolations } from "./kaiord-round-trip-validate";

const SIXTEEN_MIB = 16_777_216;
const REMOTE_CAP = { maxOutputBytes: SIXTEEN_MIB };

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
    expect(result.content[0].text).toBe(
      "Round-trip validation passed. No violations."
    );
  });

  it("should validate inline base64 FIT remotely with the capped writer", async () => {
    // Arrange
    const client = await createRemoteTestClient({ fitWriter: REMOTE_CAP });
    const input_content = encodeBase64(
      loadFitFixture("WorkoutRepeatSteps.fit")
    );

    // Act
    const result = (await client.callTool({
      name: "kaiord_round_trip_validate",
      arguments: { input_content },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toBe(
      "Round-trip validation passed. No violations."
    );
  });

  it.each([
    [{}, "Provide either input_file or input_content"],
    [{ input_file: "a.fit", input_content: "AAAA" }, "Provide only one of"],
  ])("should enforce path/content exclusivity %#", async (args, message) => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_round_trip_validate",
      arguments: args,
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(message);
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

  it("should print a categorical mismatch by its values, without deviation", () => {
    // Arrange
    const violations = [
      {
        field: "structured_workout.steps[0].intensity",
        expected: 0,
        actual: 1,
        deviation: 1,
        tolerance: 0,
        expectedValue: "warmup",
        actualValue: "active",
      },
    ];

    // Act
    const text = formatViolations(violations);

    // Assert
    expect(text).toContain(
      "structured_workout.steps[0].intensity: expected warmup, got active"
    );
    expect(text).not.toContain("deviation");
  });
});
