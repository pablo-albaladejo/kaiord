/**
 * deleteProfile cascade fan-out — integration test against real Dexie.
 *
 * Issue #435 / spec §12.4a contract: deleting a profile MUST cascade-clear
 * EVERY per-profile table. This test discovers the cascade surface
 * dynamically by iterating `db.tables` and applying `isPerProfileTable`.
 * Adding a new per-profile table without updating `deleteProfile` MUST
 * cause this test to fail (per design D18 — see
 * `is-per-profile-table.ts` for the predicate).
 *
 * Two scenarios:
 *
 * 1. Happy path — seeds one row per per-profile table for two profiles
 *    A and B, runs the production orchestration, asserts every table
 *    holds zero rows for A and exactly one row for B.
 *
 * 2. Rollback — patches one cascade method to throw mid-fan-out; asserts
 *    the orchestrating transaction aborts; asserts every table still
 *    holds two rows after the rejection (full rollback).
 *
 * The orchestration mirrors `useProfileDelete.confirmDelete` — both go
 * through the same `persistence.transaction` + `deleteProfileWithCascade`
 * + `deleteProfile` sequence. The hook is the production caller; this
 * test exercises the application-layer composition directly.
 */
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../../adapters/dexie/dexie-persistence-adapter";
import { isPerProfileTable } from "../../adapters/dexie/is-per-profile-table";
import type { PersistencePort } from "../../ports/persistence-port";
import { deleteProfile } from "./delete-profile";
import { deleteProfileWithCascade } from "./delete-profile-with-cascade";

const NOW = "2026-04-28T10:00:00.000Z";
const WEEK_START = "2026-04-13";

const seedRowFor = async (
  database: KaiordDatabase,
  tableName: string,
  profileId: string
): Promise<void> => {
  const seed = makeSeedRow(tableName, profileId);
  await database.table(tableName).put(seed);
};

const makeSeedRow = (
  tableName: string,
  profileId: string
): Record<string, unknown> => {
  const id = `${tableName}-${profileId}-row`;
  switch (tableName) {
    case "profiles":
      return {
        id: profileId,
        name: `Profile ${profileId}`,
        sportZones: {},
        linkedAccounts: [],
        createdAt: NOW,
        updatedAt: NOW,
      };
    case "coachingActivities":
    case "plannedSessions":
      // plannedSessions mirrors the coachingActivities row shape (v27 migrated
      // rows preserve it), so the same seed shape round-trips both stores.
      return {
        id,
        profileId,
        source: "train2go",
        sourceId: id,
        date: WEEK_START,
        sport: "cycling",
        title: "T",
        status: "pending",
        fetchedAt: NOW,
      };
    case "activities":
      return {
        id,
        profileId,
        date: WEEK_START,
        sport: "cycling",
        sourceBridgeId: "garmin",
        externalId: id,
        linkedWorkoutId: null,
        createdAt: NOW,
      };
    case "coachingDayNotes":
      return {
        id: `${profileId}:train2go:${WEEK_START}`,
        profileId,
        source: "train2go",
        date: WEEK_START,
        comments: [],
        fetchedAt: NOW,
      };
    case "coachingSyncState":
      return { source: "train2go", profileId, lastSyncedAt: NOW };
    case "sessionMatches":
      return {
        id,
        profileId,
        coachingActivityId: `act-${profileId}`,
        workoutId: `wkt-${profileId}`,
        date: WEEK_START,
        createdAt: NOW,
        source: "manual",
      };
    case "userPreferences":
      return { profileId, calendarView: "grid", updatedAt: NOW };
    case "autoMatchDismissals":
      return {
        profileId,
        weekStart: WEEK_START,
        dismissedPairs: [
          {
            activityId: `act-${profileId}`,
            workoutId: `wkt-${profileId}`,
            dismissedAt: NOW,
          },
        ],
      };
    case "workouts":
      return {
        id,
        profileId,
        date: WEEK_START,
        sport: "cycling",
        source: "kaiord",
        sourceId: null,
        planId: null,
        state: "raw",
        raw: null,
        krd: null,
        lastProcessingError: null,
        feedback: null,
        aiMeta: null,
        garminPushId: null,
        tags: [],
        previousState: null,
        createdAt: NOW,
        modifiedAt: null,
        updatedAt: NOW,
      };
    case "healthSleep":
    case "healthWeight":
    case "healthHrv":
    case "healthDaily":
    case "healthBodyComposition":
    case "healthStress":
    case "healthStrain":
    case "healthVitals":
      // All eight health stores share the same `id, profileId, [profileId+date], date`
      // index shape. The cascade-fan-out test only needs the primary key
      // and the per-profile + date indexed columns to round-trip a write.
      return { id, profileId, date: WEEK_START };
    case "chatMessages":
      return {
        id,
        profileId,
        conversationId: `conv-${profileId}`,
        role: "user",
        content: "hi",
        createdAt: NOW,
      };
    case "chatConversations":
      return {
        id,
        profileId,
        title: "Conversation 1",
        createdAt: NOW,
        updatedAt: NOW,
      };
    case "integrationPolicies":
      return {
        id,
        profileId,
        dataType: "training-zones",
        bridgeId: "train2go-bridge",
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: NOW,
      };
    case "aiModelBindings":
      return {
        profileId,
        purpose: "default",
        providerId: `prov-${profileId}`,
        modelId: "claude-sonnet-4-6",
        updatedAt: NOW,
      };
    case "connections":
      return {
        profileId,
        providerId: "intervals",
        status: "connected",
        mechanism: "api-key",
        updatedAt: NOW,
      };
    case "intakeEntries":
      return {
        id,
        profileId,
        date: WEEK_START,
        loggedAt: NOW,
        kcal: 500,
        proteinG: 30,
        carbG: 50,
        fatG: 15,
      };
    case "intakePresets":
      return {
        id,
        profileId,
        label: "preset",
        kcal: 400,
        proteinG: 20,
        carbG: 40,
        fatG: 10,
        createdAt: NOW,
      };
    case "energyTargets":
      return {
        profileId,
        goalType: "fat_loss",
        startWeightKg: 80,
        targetWeightKg: 75,
        targetDate: "2026-09-01",
        createdAt: NOW,
        updatedAt: NOW,
      };
    case "dataTypeSourcePolicy":
      return {
        profileId,
        dataType: "sleep",
        mode: "priority",
        sourceOrder: ["whoop-bridge"],
      };
    case "labReports":
      return {
        id,
        profileId,
        date: WEEK_START,
        provenance: { source: "manual" },
      };
    case "labValues":
      return {
        id,
        profileId,
        reportId: `lab-report-${profileId}`,
        parameterKey: "glucose",
        date: WEEK_START,
        valueRaw: 90,
        unitRaw: "mg/dL",
        valueCanonical: 90,
        unitCanonical: "mg/dL",
        refSource: "none",
        flag: "unknown",
        provenance: { source: "manual" },
      };
    default:
      // Catch-all keeps the test honest: a new per-profile table without a
      // seed entry produces an obviously-broken row that the put will reject,
      // forcing the maintainer to extend this switch alongside the schema.
      throw new Error(
        `cascade fan-out test missing a seed shape for table "${tableName}". ` +
          `Add a case to makeSeedRow when introducing a per-profile table.`
      );
  }
};

const performCascadeOrchestration = async (
  persistence: PersistencePort,
  profileId: string
): Promise<void> => {
  await persistence.transaction(async () => {
    await deleteProfileWithCascade(
      {
        workouts: persistence.workouts,
        coaching: persistence.coaching,
        coachingDayNotes: persistence.coachingDayNotes,
        coachingSyncState: persistence.coachingSyncState,
        sessionMatch: persistence.sessionMatch,
        autoMatchDismissal: persistence.autoMatchDismissal,
        userPreferences: persistence.userPreferences,
        healthCleanup: persistence.healthCleanup,
        chatMessages: persistence.chatMessages,
        chatConversations: persistence.chatConversations,
        aiModelBindings: persistence.aiModelBindings,
        connections: persistence.connections,
        intakeEntries: persistence.intakeEntries,
        intakePresets: persistence.intakePresets,
        energyTargets: persistence.energyTargets,
        dataTypeSourcePolicy: persistence.dataTypeSourcePolicy,
        labs: persistence.labs,
      },
      profileId
    );
    await deleteProfile(persistence, profileId);
  });
};

describe("deleteProfile cascade fan-out (integration)", () => {
  let database: KaiordDatabase;
  let persistence: PersistencePort;
  let dbName: string;

  beforeEach(async () => {
    const BASE36 = 36;
    dbName = `kaiord-cascade-${Date.now()}-${Math.random().toString(BASE36).slice(2)}`;
    database = new KaiordDatabase(dbName);
    await database.open();
    persistence = createDexiePersistence(database);
  });

  afterEach(async () => {
    database.close();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  });

  it("should clear every per-profile table for the deleted profile and preserves the other", async () => {
    // Arrange
    const perProfileTables = database.tables.filter(isPerProfileTable);
    expect(perProfileTables.length).toBeGreaterThan(0);
    const discoveredNames = perProfileTables.map((t) => t.name).sort();
    expect(discoveredNames).toEqual(
      expect.arrayContaining([
        "autoMatchDismissals",
        "chatMessages",
        "coachingActivities",
        "coachingSyncState",
        "sessionMatches",
        "userPreferences",
        "workouts",
      ])
    );
    const A = "00000000-0000-4000-8000-0000000000a1";
    const B = "00000000-0000-4000-8000-0000000000b2";
    await seedRowFor(database, "profiles", A);
    await seedRowFor(database, "profiles", B);
    for (const table of perProfileTables) {
      await seedRowFor(database, table.name, A);
      await seedRowFor(database, table.name, B);
    }

    // Act
    await performCascadeOrchestration(persistence, A);

    // Assert
    for (const table of perProfileTables) {
      const remainingForA = await table
        .filter((row) => (row as { profileId?: string }).profileId === A)
        .count();
      const remainingForB = await table
        .filter((row) => (row as { profileId?: string }).profileId === B)
        .count();
      expect(
        remainingForA,
        `${table.name} retained rows for the deleted profile A`
      ).toBe(0);
      expect(
        remainingForB,
        `${table.name} dropped rows for the surviving profile B`
      ).toBe(1);
    }
  });

  it("should roll every per-profile table back when one cascade step throws mid-fan-out", async () => {
    // Arrange
    const perProfileTables = database.tables.filter(isPerProfileTable);
    const A = "00000000-0000-4000-8000-0000000000c1";
    const B = "00000000-0000-4000-8000-0000000000c2";
    await seedRowFor(database, "profiles", A);
    await seedRowFor(database, "profiles", B);
    for (const table of perProfileTables) {
      await seedRowFor(database, table.name, A);
      await seedRowFor(database, table.name, B);
    }
    const userPrefsSpy = vi
      .spyOn(database.table("userPreferences"), "delete")
      .mockImplementationOnce(() =>
        Promise.reject(new Error("simulated mid-cascade failure"))
      );

    // Act
    await expect(performCascadeOrchestration(persistence, A)).rejects.toThrow();

    // Assert
    for (const table of perProfileTables) {
      const countForA = await table
        .filter((row) => (row as { profileId?: string }).profileId === A)
        .count();
      const countForB = await table
        .filter((row) => (row as { profileId?: string }).profileId === B)
        .count();
      expect(
        countForA,
        `${table.name} lost A's row despite a mid-cascade failure`
      ).toBe(1);
      expect(
        countForB,
        `${table.name} lost B's row despite a mid-cascade failure`
      ).toBe(1);
    }
    const profileA = await database.table("profiles").get(A);
    const profileB = await database.table("profiles").get(B);
    expect(profileA).toBeDefined();
    expect(profileB).toBeDefined();

    // Cleanup
    userPrefsSpy.mockRestore();
  });
});
