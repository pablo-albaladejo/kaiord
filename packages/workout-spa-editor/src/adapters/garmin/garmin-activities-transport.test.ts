/**
 * Unit tests for the garmin activities transport adapter: envelope
 * handling and Zod validation over a mocked bridge transport
 * (spec: spa-integration-adapters — adapter implements FetchActivities).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import { readGarminActivities } from "./garmin-activities-transport";

vi.mock("../bridge/bridge-transport", () => ({
  sendBridgeMessage: vi.fn(),
}));

const ACTIVITIES_TIMEOUT_MS = 15_000;

const mockedSend = vi.mocked(sendBridgeMessage);

describe("readGarminActivities", () => {
  beforeEach(() => {
    mockedSend.mockReset();
  });

  it("should return the parsed feed and strip unknown garmin fields", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      data: {
        activities: [
          {
            activityId: 111,
            activityName: "Morning Ride",
            rogueField: "stripped",
          },
        ],
        disabled: false,
        throttled: false,
      },
    });

    // Act
    const result = await readGarminActivities("ext-1");

    // Assert
    expect(result).toEqual({
      activities: [{ activityId: 111, activityName: "Morning Ride" }],
      disabled: false,
      throttled: false,
    });
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-1",
      { action: "activities" },
      ACTIVITIES_TIMEOUT_MS
    );
  });

  it.each([
    {
      label: "surfaces the bridge error",
      envelope: { ok: false as const, error: "No Garmin tab" },
      message: "No Garmin tab",
    },
    {
      label: "falls back to a generic message when there is no error",
      envelope: { ok: false as const },
      message: "Garmin activities pull failed",
    },
  ])(
    "should reject a failed envelope and $label",
    async ({ envelope, message }) => {
      // Arrange
      mockedSend.mockResolvedValue(envelope);

      // Act
      const attempt = readGarminActivities("ext-1");

      // Assert
      await expect(attempt).rejects.toThrow(message);
    }
  );

  it("should reject a malformed payload instead of passing it downstream", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      data: { activities: "not-an-array", disabled: false, throttled: false },
    });

    // Act
    const attempt = readGarminActivities("ext-1");

    // Assert
    await expect(attempt).rejects.toThrow(
      "Malformed Garmin activities response"
    );
  });
});
