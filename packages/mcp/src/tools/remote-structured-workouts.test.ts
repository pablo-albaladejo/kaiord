import { describe, expect, it } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import {
  getFixturePath,
  loadFitFixture,
  loadKrdFixture,
} from "../tests/helpers/test-fixtures";
import { encodeBase64 } from "../utils/base64";

const SLEEP_FIT = "HealthSleepFullNight.fit";
const SLEEP_B64 = encodeBase64(loadFitFixture(SLEEP_FIT));
const ACTIVITY_B64 = encodeBase64(loadFitFixture("Activity.fit"));
const WORKOUT = loadKrdFixture("WorkoutIndividualSteps.krd");
const HR_BPM = 142;
const RECORDS = [
  {
    timestamp: "2025-01-15T10:00:00Z",
    position: { lat: 40.4, lon: -3.7 },
    heartRate: HR_BPM,
  },
];
const TCX_ACTIVITY = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities><Activity Sport="Running"><Id>2025-01-15T10:00:00Z</Id>
    <Lap StartTime="2025-01-15T10:00:00Z"><TotalTimeSeconds>60</TotalTimeSeconds>
      <Track><Trackpoint><Time>2025-01-15T10:00:00Z</Time>
        <HeartRateBpm><Value>142</Value></HeartRateBpm></Trackpoint></Track>
    </Lap></Activity></Activities>
</TrainingCenterDatabase>`;

const call = async (
  name: string,
  args: Record<string, unknown>
): Promise<McpToolResult> => {
  const client = await createRemoteTestClient();
  return (await client.callTool({ name, arguments: args })) as McpToolResult;
};

describe("remote structured-workouts-only gate", () => {
  it("should reject a FIT sleep record on inspect without summarising it", async () => {
    // Arrange
    const args = { input_content: SLEEP_B64, input_format: "fit" };

    // Act
    const result = await call("kaiord_inspect", args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("sleep_record");
    expect(result.content[0].text).not.toContain("Sport:");
  });

  it("should reject a FIT activity on convert naming recorded_activity", async () => {
    // Arrange
    const args = {
      input_content: ACTIVITY_B64,
      input_format: "fit",
      output_format: "krd",
    };

    // Act
    const result = await call("kaiord_convert", args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("recorded_activity");
  });

  it("should reject a TCX activity on convert", async () => {
    // Arrange
    const args = {
      input_content: TCX_ACTIVITY,
      input_format: "tcx",
      output_format: "krd",
    };

    // Act
    const result = await call("kaiord_convert", args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).not.toContain(String(HR_BPM));
  });

  it.each([
    ["records", { ...WORKOUT, records: RECORDS }],
    [
      "extensions.health",
      {
        ...WORKOUT,
        extensions: { ...WORKOUT.extensions, health: { sleep: {} } },
      },
    ],
  ])("should reject a workout-labelled KRD carrying %s", async (field, krd) => {
    // Arrange
    const input_content = JSON.stringify(krd);

    // Act
    const results = await Promise.all([
      call("kaiord_validate", { input_content }),
      call("kaiord_extract_workout", { input_content, input_format: "krd" }),
      call("kaiord_diff", {
        content1: input_content,
        format1: "krd",
        content2: JSON.stringify(WORKOUT),
        format2: "krd",
      }),
    ]);

    // Assert
    for (const result of results) {
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain(field);
    }
  });

  it("should reject a FIT sleep record on round-trip validation", async () => {
    // Arrange
    const args = { input_content: SLEEP_B64 };

    // Act
    const result = await call("kaiord_round_trip_validate", args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("sleep_record");
  });

  it("should keep accepting the sleep record on the local server", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_inspect",
      arguments: { input_file: getFixturePath("fit", SLEEP_FIT) },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("sleep_record");
  });
});
