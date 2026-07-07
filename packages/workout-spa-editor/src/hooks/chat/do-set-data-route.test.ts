/**
 * Tests for doSetDataRoute — the set_data_route action-op implementation.
 * Includes the conversational kill test: disabling a route via chat must
 * cut the SAME real gate the production sync/push paths consult, not just
 * flip an isolated flag.
 */
import { describe, expect, it } from "vitest";

import { hasEnabledPlannedSessionImportRoute } from "../../application/coaching/planned-session-import-route";
import {
  executeWorkoutPush,
  NoActiveExportRouteError,
} from "../../application/export/execute-workout-push";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { doSetDataRoute } from "./do-set-data-route";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

describe("doSetDataRoute — enable_route / disable_route", () => {
  it("should resolve the chat-facing integration id to the storage bridge id", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = (await doSetDataRoute(persistence, PROFILE_ID, {
      action: "enable_route",
      dataType: "planned-session",
      integrationId: "train2go",
      direction: "import",
    })) as { enabled: boolean; mode: string };

    // Assert
    expect(result).toMatchObject({ enabled: true, mode: "auto" });
    const stored = await persistence.integrationPolicy.findByNaturalKey({
      profileId: PROFILE_ID,
      dataType: "planned-session",
      direction: "import",
      bridgeId: "train2go-bridge",
    });
    expect(stored?.enabled).toBe(true);
  });

  it("should preserve an existing route's mode when toggling enabled", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put({
      id: "existing",
      profileId: PROFILE_ID,
      dataType: "planned-session",
      bridgeId: "train2go-bridge",
      direction: "import",
      mode: "manual",
      enabled: false,
      updatedAt: "2026-07-01T00:00:00.000Z",
    });

    // Act
    const result = (await doSetDataRoute(persistence, PROFILE_ID, {
      action: "enable_route",
      dataType: "planned-session",
      integrationId: "train2go",
      direction: "import",
    })) as { mode: string };

    // Assert
    expect(result.mode).toBe("manual");
  });

  it("should return an error for an integration with no bridge to route", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetDataRoute(persistence, PROFILE_ID, {
      action: "enable_route",
      dataType: "sleep",
      integrationId: "manual",
      direction: "import",
    });

    // Assert
    expect(result).toEqual({
      error: "integration_not_bridged",
      integrationId: "manual",
    });
  });

  it("should cut the real Train2Go sync gate when planned-session import is disabled via chat (kill test)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put({
      id: "existing",
      profileId: PROFILE_ID,
      dataType: "planned-session",
      bridgeId: "train2go-bridge",
      direction: "import",
      mode: "auto",
      enabled: true,
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    expect(
      await hasEnabledPlannedSessionImportRoute(
        persistence.integrationPolicy,
        PROFILE_ID
      )
    ).toBe(true);

    // Act
    await doSetDataRoute(persistence, PROFILE_ID, {
      action: "disable_route",
      dataType: "planned-session",
      integrationId: "train2go",
      direction: "import",
    });

    // Assert
    expect(
      await hasEnabledPlannedSessionImportRoute(
        persistence.integrationPolicy,
        PROFILE_ID
      )
    ).toBe(false);
  });

  it("should block the real Garmin push gate when the workout export route is disabled via chat (kill test)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.integrationPolicy.put({
      id: "existing",
      profileId: PROFILE_ID,
      dataType: "workout",
      bridgeId: "garmin-bridge",
      direction: "export",
      mode: "manual",
      enabled: true,
      updatedAt: "2026-07-01T00:00:00.000Z",
    });

    // Act
    await doSetDataRoute(persistence, PROFILE_ID, {
      action: "disable_route",
      dataType: "workout",
      integrationId: "garmin",
      direction: "export",
    });

    // Assert
    await expect(
      executeWorkoutPush(
        {
          policyRepo: persistence.integrationPolicy,
          ledgerRepo: {} as never,
        },
        {
          profileId: PROFILE_ID,
          kaiordRecordId: "w1",
          destinationBridgeId: "garmin-bridge",
          payload: {},
          pushFn: async () => ({ externalId: "ext-1" }),
        }
      )
    ).rejects.toBeInstanceOf(NoActiveExportRouteError);
  });
});

describe("doSetDataRoute — set_source_policy", () => {
  it("should resolve a single-source priority order (read only from that source)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetDataRoute(persistence, PROFILE_ID, {
      action: "set_source_policy",
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop"],
    });

    // Assert
    expect(result).toEqual({
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });
    const stored = await persistence.dataTypeSourcePolicy.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });
    expect(stored).toMatchObject({
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });
  });

  it("should keep the 'manual' source key unresolved (not a bridge id)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetDataRoute(persistence, PROFILE_ID, {
      action: "set_source_policy",
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["manual", "garmin"],
    });

    // Assert
    expect(result).toEqual({
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["manual", "garmin-bridge"],
    });
  });

  it("should clear the source order when switching to union", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetDataRoute(persistence, PROFILE_ID, {
      action: "set_source_policy",
      dataType: "sleep",
      mode: "union",
      sourceOrder: ["whoop"],
    });

    // Assert
    expect(result).toEqual({
      dataType: "sleep",
      mode: "union",
      sourceOrder: [],
    });
  });
});
