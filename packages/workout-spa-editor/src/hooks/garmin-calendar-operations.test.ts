import { describe, expect, it, vi } from "vitest";

import { SPA_ACTION_TIMEOUT_MS } from "../application/garmin-placement/placement-timing";
import type { GarminScheduleId, GarminWorkoutId } from "../types/garmin-ledger";
import { createGarminCalendarPort } from "./garmin-calendar-operations";

const EXTENSION_ID = "ext-1";
const WORKOUT = "1707805999" as GarminWorkoutId;
const SCHEDULE = "5000" as GarminScheduleId;
const DATE = "2026-10-05";

const portWith = (answer: unknown) => {
  const send = vi.fn().mockResolvedValue(answer);
  return { send, port: createGarminCalendarPort(() => EXTENSION_ID, send) };
};

describe("createGarminCalendarPort", () => {
  it("should send schedule with the SPA action timeout and parse the id", async () => {
    // Arrange
    const { send, port } = portWith({
      ok: true,
      data: { workoutScheduleId: "5000" },
    });

    // Act
    const answer = await port.schedule(WORKOUT, DATE);

    // Assert
    expect(send).toHaveBeenCalledWith(
      EXTENSION_ID,
      { action: "schedule", workoutId: WORKOUT, date: DATE },
      SPA_ACTION_TIMEOUT_MS
    );
    expect(answer).toEqual({ ok: true, workoutScheduleId: SCHEDULE });
  });

  it.each([
    ["no id", { ok: true, data: { workoutScheduleId: null } }],
    ["a non-canonical id", { ok: true, data: { workoutScheduleId: "007" } }],
    ["no data", { ok: true }],
  ])("should answer a 2xx with %s as ok without an id", async (_n, res) => {
    // Arrange
    const { port } = portWith(res);

    // Act
    const answer = await port.schedule(WORKOUT, DATE);

    // Assert
    expect(answer).toEqual({ ok: true, workoutScheduleId: null });
  });

  it.each([
    [
      "a Garmin status",
      { ok: false, delivered: true, error: "Schedule failed", status: 503 },
      { ok: false, error: "Schedule failed", status: 503 },
    ],
    [
      "a refusal",
      { ok: false, delivered: true, error: "Invalid date", retryable: false },
      { ok: false, error: "Invalid date", retryable: false },
    ],
    [
      "a dead session",
      { ok: false, delivered: true, error: "x", needsReauth: true },
      { ok: false, error: "x", needsReauth: true },
    ],
    [
      "an undelivered message",
      { ok: false, delivered: false, error: "Extension did not respond" },
      { ok: false, error: "Extension did not respond", delivered: false },
    ],
  ])("should carry the envelope of %s", async (_n, res, expected) => {
    // Arrange
    const { port } = portWith(res);

    // Act
    const answer = await port.schedule(WORKOUT, DATE);

    // Assert
    expect(answer).toEqual(expected);
  });

  it("should send unschedule by schedule id", async () => {
    // Arrange
    const { send, port } = portWith({ ok: true, data: null });

    // Act
    const answer = await port.unschedule(SCHEDULE);

    // Assert
    expect(send.mock.calls[0]![1]).toEqual({
      action: "unschedule",
      scheduleId: SCHEDULE,
    });
    expect(answer).toEqual({ ok: true });
  });

  it("should parse calendar-find entries, keeping an id-less one", async () => {
    // Arrange
    const { send, port } = portWith({
      ok: true,
      data: [
        { workoutScheduleId: "5000", date: DATE },
        { workoutScheduleId: null, date: "2026-10-06" },
      ],
    });

    // Act
    const answer = await port.find(WORKOUT, DATE);

    // Assert
    expect(send.mock.calls[0]![1]).toEqual({
      action: "calendar-find",
      workoutId: WORKOUT,
      date: DATE,
    });
    expect(answer).toEqual({
      ok: true,
      entries: [
        { workoutScheduleId: SCHEDULE, date: DATE },
        { workoutScheduleId: null, date: "2026-10-06" },
      ],
    });
  });

  it.each([
    ["a non-array payload", { ok: true, data: { calendarItems: [] } }],
    ["an entry with no date", { ok: true, data: [{ workoutScheduleId: "1" }] }],
    ["a malformed date", { ok: true, data: [{ date: "2026-02-30" }] }],
  ])("should answer %s as a failed read, never found 0", async (_n, res) => {
    // Arrange
    const { port } = portWith(res);

    // Act
    const answer = await port.find(WORKOUT, DATE);

    // Assert
    expect(answer.ok).toBe(false);
  });
});
