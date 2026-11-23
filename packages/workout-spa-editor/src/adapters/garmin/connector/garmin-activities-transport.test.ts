/**
 * Unit tests for the garmin activities transport adapter: envelope
 * handling and Zod validation over a mocked bridge transport
 * (spec: spa-integration-adapters — adapter implements FetchActivities).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readGarminActivities } from "./garmin-activities-transport";

// An extension one protocol behind (the store version): it refuses the
// thin Bridge's `request`, and the transport falls back to the legacy
// action, whose answer each case sets.
const { legacySend } = vi.hoisted(() => ({ legacySend: vi.fn() }));
vi.mock("../../bridge/bridge-transport", () => ({
  sendBridgeMessage: (id: string, message: { action?: string }, t: number) =>
    message?.action === "request"
      ? Promise.resolve({
          ok: false,
          protocolVersion: 1,
          error: "Origin or action not permitted",
          retryable: false,
        })
      : legacySend(id, message, t),
}));

const ACTIVITIES_TIMEOUT_MS = 15_000;

const mockedSend = legacySend;

// Each case pulls a minute after the last, past the Connector's pacing.
const A_MINUTE_MS = 60_000;
let clock = Date.parse("2026-11-23T08:00:00Z");

describe("readGarminActivities", () => {
  beforeEach(() => {
    mockedSend.mockReset();
    clock += A_MINUTE_MS;
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(clock);
  });

  afterEach(() => {
    vi.useRealTimers();
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
