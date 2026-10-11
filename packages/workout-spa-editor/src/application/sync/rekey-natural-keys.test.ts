import { describe, expect, it } from "vitest";

import { rekeyTableRows } from "./rekey-profile-rows";

const AUTO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TARGET = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const rekey = { from: [AUTO], to: TARGET };
const OLD = "2026-10-01T00:00:00.000Z";
const NEW = "2026-10-09T00:00:00.000Z";
const NIGHT = { sourceBridgeId: "whoop", externalId: "night-7" };

describe("rekeyTableRows natural keys", () => {
  it.each(["healthSleep", "healthHrv", "activities"])(
    "should keep one %s row when both profiles imported the same record",
    (table) => {
      // Arrange
      const rows = [
        { id: "t-uuid", profileId: TARGET, ...NIGHT, createdAt: OLD },
        { id: "a-uuid", profileId: AUTO, ...NIGHT, createdAt: OLD },
      ];

      // Act
      const out = rekeyTableRows(table, rows, rekey);

      // Assert
      expect(out).toEqual([
        { id: "t-uuid", profileId: TARGET, ...NIGHT, createdAt: OLD },
      ]);
    }
  );

  it("should keep the target id when the newer auto row wins on the natural key", () => {
    // Arrange
    const rows = [
      { id: "t-uuid", profileId: TARGET, ...NIGHT, score: 1, updatedAt: OLD },
      { id: "a-uuid", profileId: AUTO, ...NIGHT, score: 2, updatedAt: NEW },
    ];

    // Act
    const out = rekeyTableRows("healthSleep", rows, rekey);

    // Assert
    // A row under the auto id would leave the remote's `t-uuid` row to come
    // back on the next merge as a duplicate.
    expect(out).toEqual([
      { id: "t-uuid", profileId: TARGET, ...NIGHT, score: 2, updatedAt: NEW },
    ]);
  });

  it("should fall back to the id when a row has no externalId", () => {
    // Arrange
    const rows = [
      { id: "t-uuid", profileId: TARGET, sourceBridgeId: "manual" },
      { id: "a-uuid", profileId: AUTO, sourceBridgeId: "manual" },
    ];

    // Act
    const out = rekeyTableRows("healthWeight", rows, rekey);

    // Assert
    expect(out.map((r) => r.id)).toEqual(["t-uuid", "a-uuid"]);
  });

  it("should keep the target's match when both profiles matched the same planned activity", () => {
    // Arrange
    const rows = [
      {
        id: "m-t",
        profileId: TARGET,
        coachingActivityId: `${TARGET}:train2go:42`,
        workoutId: "w-target",
        createdAt: OLD,
      },
      {
        id: "m-a",
        profileId: AUTO,
        coachingActivityId: `${AUTO}:train2go:42`,
        workoutId: "w-auto",
        createdAt: NEW,
      },
    ];

    // Act
    const out = rekeyTableRows("sessionMatches", rows, rekey);

    // Assert
    expect(out.map((r) => r.id)).toEqual(["m-t"]);
  });

  it("should keep the target's match when both profiles matched the same workout", () => {
    // Arrange
    const rows = [
      {
        id: "m-t",
        profileId: TARGET,
        coachingActivityId: `${TARGET}:train2go:1`,
        workoutId: "w-1",
      },
      {
        id: "m-a",
        profileId: AUTO,
        coachingActivityId: `${AUTO}:train2go:2`,
        workoutId: "w-1",
      },
    ];

    // Act
    const out = rekeyTableRows("sessionMatches", rows, rekey);

    // Assert
    expect(out.map((r) => r.id)).toEqual(["m-t"]);
  });
});
