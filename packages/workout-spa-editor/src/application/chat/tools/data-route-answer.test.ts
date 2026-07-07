import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { DataHubRow } from "../../data-hub/build-data-hub-matrix";
import { buildDataRouteAnswer } from "./data-route-answer";

const PROFILE_ID = "p1";
const DAY = "2026-07-07";

const row = (over: Partial<DataHubRow> = {}): DataHubRow => ({
  dataType: "planned-session",
  label: "Planned Session",
  cells: [
    {
      integrationId: "train2go",
      direction: "import",
      state: "active",
      enabled: true,
      lastSyncedAt: "2026-07-06T08:00:00.000Z",
      routeId: "route-1",
      routeMode: "auto",
    },
    {
      integrationId: "manual",
      direction: "import",
      state: "na",
      enabled: false,
    },
  ],
  ...over,
});

describe("buildDataRouteAnswer", () => {
  it("should default the source policy to union with an empty order when unset", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const answer = await buildDataRouteAnswer(row(), {
      persistence,
      profileId: PROFILE_ID,
      today: DAY,
    });

    // Assert
    expect(answer.sourcePolicy).toEqual({ mode: "union", sourceOrder: [] });
  });

  it("should surface a persisted source policy's mode and order", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.dataTypeSourcePolicy.put({
      profileId: PROFILE_ID,
      dataType: "planned-session",
      mode: "priority",
      sourceOrder: ["train2go-bridge"],
    });

    // Act
    const answer = await buildDataRouteAnswer(row(), {
      persistence,
      profileId: PROFILE_ID,
      today: DAY,
    });

    // Assert
    expect(answer.sourcePolicy).toEqual({
      mode: "priority",
      sourceOrder: ["train2go-bridge"],
    });
  });

  it("should drop not-applicable cells from the routes list", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const answer = await buildDataRouteAnswer(row(), {
      persistence,
      profileId: PROFILE_ID,
      today: DAY,
    });

    // Assert
    expect(answer.routes).toHaveLength(1);
    expect(answer.routes[0]).toMatchObject({
      integrationId: "train2go",
      enabled: true,
      mode: "auto",
      lastSyncedAt: "2026-07-06T08:00:00.000Z",
    });
  });

  it("should omit effectiveSourceToday for a non-health data type", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const answer = await buildDataRouteAnswer(row(), {
      persistence,
      profileId: PROFILE_ID,
      today: DAY,
    });

    // Assert
    expect(answer.effectiveSourceToday).toBeUndefined();
  });

  it("should summarize union sources for a health data type", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthSleep.put({
      id: "s1",
      profileId: PROFILE_ID,
      date: DAY,
      krd: { hours: 8 } as never,
      sourceBridgeId: "whoop-bridge",
    });
    await persistence.healthSleep.put({
      id: "s2",
      profileId: PROFILE_ID,
      date: DAY,
      krd: { hours: 7 } as never,
      sourceBridgeId: "garmin-bridge",
    });

    // Act
    const answer = await buildDataRouteAnswer(row({ dataType: "sleep" }), {
      persistence,
      profileId: PROFILE_ID,
      today: DAY,
    });

    // Assert
    expect(answer.effectiveSourceToday).toEqual({
      mode: "union",
      sources: ["whoop-bridge", "garmin-bridge"],
    });
  });

  it("should summarize the priority winner and fallback flag for a health data type", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.dataTypeSourcePolicy.put({
      profileId: PROFILE_ID,
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge", "garmin-bridge"],
    });
    await persistence.integrationPolicy.put({
      id: "ip1",
      profileId: PROFILE_ID,
      dataType: "sleep",
      bridgeId: "garmin-bridge",
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    await persistence.healthSleep.put({
      id: "s3",
      profileId: PROFILE_ID,
      date: DAY,
      krd: { hours: 7 } as never,
      sourceBridgeId: "garmin-bridge",
    });

    // Act
    const answer = await buildDataRouteAnswer(row({ dataType: "sleep" }), {
      persistence,
      profileId: PROFILE_ID,
      today: DAY,
    });

    // Assert
    // whoop-bridge is ranked first but has no enabled import policy, so the
    // reconciled order picks garmin-bridge without treating it as a fallback.
    expect(answer.effectiveSourceToday).toEqual({
      mode: "priority",
      effectiveSource: "garmin-bridge",
      usedFallback: false,
    });
  });
});
