import { describe, expect, it } from "vitest";

import { rekeyTableRows } from "./rekey-profile-rows";

const AUTO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TARGET = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const rekey = { from: [AUTO], to: TARGET };
const OLD = "2026-10-01T00:00:00.000Z";
const NEW = "2026-10-09T00:00:00.000Z";

describe("rekeyTableRows collisions", () => {
  it("should keep the newer userPreferences row when both carry a clock", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, units: "imperial", updatedAt: OLD },
      { profileId: AUTO, units: "metric", updatedAt: NEW },
    ];

    // Act
    const out = rekeyTableRows("userPreferences", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, units: "metric", updatedAt: NEW },
    ]);
  });

  it("should keep the target userPreferences row when the target has no clock", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, units: "imperial" },
      { profileId: AUTO, units: "metric", updatedAt: NEW },
    ];

    // Act
    const out = rekeyTableRows("userPreferences", rows, rekey);

    // Assert
    expect(out).toEqual([{ profileId: TARGET, units: "imperial" }]);
  });

  it("should keep the target aiModelBindings row for the same purpose", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, purpose: "chat", modelId: "remote" },
      { profileId: AUTO, purpose: "chat", modelId: "local" },
      { profileId: AUTO, purpose: "workout", modelId: "local" },
    ];

    // Act
    const out = rekeyTableRows("aiModelBindings", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, purpose: "chat", modelId: "remote" },
      { profileId: TARGET, purpose: "workout", modelId: "local" },
    ]);
  });

  it("should keep the target dataTypeSourcePolicy row for the same data type", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, dataType: "sleep", mode: "priority" },
      { profileId: AUTO, dataType: "sleep", mode: "union" },
    ];

    // Act
    const out = rekeyTableRows("dataTypeSourcePolicy", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, dataType: "sleep", mode: "priority" },
    ]);
  });

  it("should keep the target energyTargets row when the clocks tie", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, goalType: "maintain", updatedAt: OLD },
      { profileId: AUTO, goalType: "fat_loss", updatedAt: OLD },
    ];

    // Act
    const out = rekeyTableRows("energyTargets", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, goalType: "maintain", updatedAt: OLD },
    ]);
  });

  it("should keep the newer energyTargets row when the auto one is newer", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, goalType: "maintain", updatedAt: OLD },
      { profileId: AUTO, goalType: "fat_loss", updatedAt: NEW },
    ];

    // Act
    const out = rekeyTableRows("energyTargets", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, goalType: "fat_loss", updatedAt: NEW },
    ]);
  });

  it("should keep the target autoMatchDismissals row for the same week", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, weekStart: "2026-10-05", dismissedPairs: [] },
      { profileId: AUTO, weekStart: "2026-10-05", dismissedPairs: [{ a: 1 }] },
    ];

    // Act
    const out = rekeyTableRows("autoMatchDismissals", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, weekStart: "2026-10-05", dismissedPairs: [] },
    ]);
  });

  it("should re-key a coachingDayNotes composite id and keep the newer row on collision", () => {
    // Arrange
    const rows = [
      {
        id: `${TARGET}:train2go:2026-10-05`,
        profileId: TARGET,
        updatedAt: NEW,
      },
      { id: `${AUTO}:train2go:2026-10-05`, profileId: AUTO, updatedAt: OLD },
      { id: `${AUTO}:train2go:2026-10-06`, profileId: AUTO, updatedAt: OLD },
    ];

    // Act
    const out = rekeyTableRows("coachingDayNotes", rows, rekey);

    // Assert
    expect(out).toEqual([
      {
        id: `${TARGET}:train2go:2026-10-05`,
        profileId: TARGET,
        updatedAt: NEW,
      },
      {
        id: `${TARGET}:train2go:2026-10-06`,
        profileId: TARGET,
        updatedAt: OLD,
      },
    ]);
  });

  it("should keep the target integrationPolicies row on its unique natural key", () => {
    // Arrange
    const natural = {
      dataType: "sleep",
      direction: "import",
      bridgeId: "whoop",
    };
    const rows = [
      { id: "p-target", profileId: TARGET, ...natural, enabled: true },
      { id: "p-auto", profileId: AUTO, ...natural, enabled: false },
    ];

    // Act
    const out = rekeyTableRows("integrationPolicies", rows, rekey);

    // Assert
    expect(out.map((r) => r.id)).toEqual(["p-target"]);
  });

  it("should keep the target connection for the same provider", () => {
    // Arrange
    const rows = [
      { profileId: TARGET, providerId: "garmin", status: "connected" },
      { profileId: AUTO, providerId: "garmin", status: "disconnected" },
    ];

    // Act
    const out = rekeyTableRows("connections", rows, rekey);

    // Assert
    expect(out).toEqual([
      { profileId: TARGET, providerId: "garmin", status: "connected" },
    ]);
  });

  it("should drop the auto profile's coachingSyncState cursors", () => {
    // Arrange
    const rows = [
      { source: "train2go", profileId: TARGET, lastSyncedAt: OLD },
      { source: "train2go", profileId: AUTO, lastSyncedAt: NEW },
    ];

    // Act
    const out = rekeyTableRows("coachingSyncState", rows, rekey);

    // Assert
    expect(out).toEqual([
      { source: "train2go", profileId: TARGET, lastSyncedAt: OLD },
    ]);
  });

  it("should rewrite embedded profile prefixes and leave other profiles alone", () => {
    // Arrange
    const other = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const rows = [
      {
        id: "m-1",
        profileId: AUTO,
        coachingActivityId: `${AUTO}:train2go:42`,
        workoutId: "w-1",
      },
      { id: "m-2", profileId: other, coachingActivityId: `${other}:t:1` },
    ];

    // Act
    const out = rekeyTableRows("sessionMatches", rows, rekey);

    // Assert
    expect(out).toEqual([
      { id: "m-2", profileId: other, coachingActivityId: `${other}:t:1` },
      {
        id: "m-1",
        profileId: TARGET,
        coachingActivityId: `${TARGET}:train2go:42`,
        workoutId: "w-1",
      },
    ]);
  });
});
