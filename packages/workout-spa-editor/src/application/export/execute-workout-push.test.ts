/**
 * Tests for executeWorkoutPush — the shared export governance gate.
 * Pure use-case with in-memory port mocks; no React.
 */
import { describe, expect, it, vi } from "vitest";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import type { IntegrationPolicy } from "../../types/integration-policy";
import {
  executeWorkoutPush,
  NoActiveExportRouteError,
} from "./execute-workout-push";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const KAIORD_RECORD_ID = "22222222-2222-4222-8222-222222222222";
const GARMIN_BRIDGE_ID = "garmin-bridge";
const PAYLOAD = { gcnWorkout: "data" };

const enabledPolicy = (bridgeId: string): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "workout",
  bridgeId,
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
});

const makePolicyRepo = (policies: IntegrationPolicy[]) => ({
  findByProfileDirection: vi.fn(async () => policies),
});

const makeLedgerRepo = (): ExportLedgerRepository & {
  store: Map<string, ExportLedgerEntry>;
} => {
  const store = new Map<string, ExportLedgerEntry>();
  const naturalKeyIndex = new Map<string, string>();
  const naturalKey = (krd: string, dest: string) => `${krd}::${dest}`;
  return {
    store,
    findByNaturalKey: async ({ kaiordRecordId, destinationBridgeId }) => {
      const id = naturalKeyIndex.get(
        naturalKey(kaiordRecordId, destinationBridgeId)
      );
      return id ? store.get(id) : undefined;
    },
    insertPending: async (entry) => {
      const key = naturalKey(entry.kaiordRecordId, entry.destinationBridgeId);
      if (naturalKeyIndex.has(key)) return { ok: false, reason: "constraint" };
      store.set(entry.id, entry);
      naturalKeyIndex.set(key, entry.id);
      return { ok: true };
    },
    update: async (id, patch) => {
      const existing = store.get(id);
      if (existing) store.set(id, { ...existing, ...patch });
    },
    deleteById: async (id) => {
      const entry = store.get(id);
      if (entry) {
        naturalKeyIndex.delete(
          naturalKey(entry.kaiordRecordId, entry.destinationBridgeId)
        );
        store.delete(id);
      }
    },
    countByDataType: async (dt) =>
      [...store.values()].filter((e) => e.dataType === dt).length,
  };
};

describe("executeWorkoutPush", () => {
  it("should throw NoActiveExportRouteError without invoking pushFn when no policy exists for the destination", async () => {
    // Arrange
    const policyRepo = makePolicyRepo([]);
    const ledgerRepo = makeLedgerRepo();
    const pushFn = vi.fn();

    // Act
    const act = () =>
      executeWorkoutPush(
        { policyRepo, ledgerRepo },
        {
          profileId: PROFILE_ID,
          kaiordRecordId: KAIORD_RECORD_ID,
          destinationBridgeId: GARMIN_BRIDGE_ID,
          payload: PAYLOAD,
          pushFn,
        }
      );

    // Assert
    await expect(act()).rejects.toBeInstanceOf(NoActiveExportRouteError);
    expect(pushFn).not.toHaveBeenCalled();
    expect(ledgerRepo.store.size).toBe(0);
  });

  it("should throw NoActiveExportRouteError when the only policy for that data type is disabled", async () => {
    // Arrange
    const disabled = { ...enabledPolicy(GARMIN_BRIDGE_ID), enabled: false };
    const policyRepo = makePolicyRepo([disabled]);
    const ledgerRepo = makeLedgerRepo();
    const pushFn = vi.fn();

    // Act
    const act = () =>
      executeWorkoutPush(
        { policyRepo, ledgerRepo },
        {
          profileId: PROFILE_ID,
          kaiordRecordId: KAIORD_RECORD_ID,
          destinationBridgeId: GARMIN_BRIDGE_ID,
          payload: PAYLOAD,
          pushFn,
        }
      );

    // Assert
    await expect(act()).rejects.toBeInstanceOf(NoActiveExportRouteError);
    expect(pushFn).not.toHaveBeenCalled();
  });

  it("should throw NoActiveExportRouteError when an enabled policy exists for a different bridge", async () => {
    // Arrange
    const policyRepo = makePolicyRepo([enabledPolicy("other-bridge")]);
    const ledgerRepo = makeLedgerRepo();
    const pushFn = vi.fn();

    // Act
    const act = () =>
      executeWorkoutPush(
        { policyRepo, ledgerRepo },
        {
          profileId: PROFILE_ID,
          kaiordRecordId: KAIORD_RECORD_ID,
          destinationBridgeId: GARMIN_BRIDGE_ID,
          payload: PAYLOAD,
          pushFn,
        }
      );

    // Assert
    await expect(act()).rejects.toBeInstanceOf(NoActiveExportRouteError);
    expect(pushFn).not.toHaveBeenCalled();
  });

  it("should include the destination bridge id on the error for a visible cause", async () => {
    // Arrange
    const policyRepo = makePolicyRepo([]);
    const ledgerRepo = makeLedgerRepo();

    // Act
    let error: unknown;
    try {
      await executeWorkoutPush(
        { policyRepo, ledgerRepo },
        {
          profileId: PROFILE_ID,
          kaiordRecordId: KAIORD_RECORD_ID,
          destinationBridgeId: GARMIN_BRIDGE_ID,
          payload: PAYLOAD,
          pushFn: vi.fn(),
        }
      );
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toBeInstanceOf(NoActiveExportRouteError);
    expect((error as NoActiveExportRouteError).destinationBridgeId).toBe(
      GARMIN_BRIDGE_ID
    );
    expect((error as Error).message).toContain(GARMIN_BRIDGE_ID);
  });

  it("should push and record a ledger entry when an enabled policy exists for the destination", async () => {
    // Arrange
    const policyRepo = makePolicyRepo([enabledPolicy(GARMIN_BRIDGE_ID)]);
    const ledgerRepo = makeLedgerRepo();
    const pushFn = vi.fn().mockResolvedValue({ externalId: "gw-123" });

    // Act
    const result = await executeWorkoutPush(
      { policyRepo, ledgerRepo },
      {
        profileId: PROFILE_ID,
        kaiordRecordId: KAIORD_RECORD_ID,
        destinationBridgeId: GARMIN_BRIDGE_ID,
        payload: PAYLOAD,
        pushFn,
      }
    );

    // Assert
    expect(pushFn).toHaveBeenCalledWith(PAYLOAD);
    expect(result.outcome).toBe("created");
    expect(result.externalId).toBe("gw-123");
    expect(ledgerRepo.store.size).toBe(1);
  });

  it("should not push again and should not duplicate the ledger entry on re-push of the same payload", async () => {
    // Arrange
    const policyRepo = makePolicyRepo([enabledPolicy(GARMIN_BRIDGE_ID)]);
    const ledgerRepo = makeLedgerRepo();
    const pushFn = vi.fn().mockResolvedValue({ externalId: "gw-123" });
    const input = {
      profileId: PROFILE_ID,
      kaiordRecordId: KAIORD_RECORD_ID,
      destinationBridgeId: GARMIN_BRIDGE_ID,
      payload: PAYLOAD,
      pushFn,
    };
    await executeWorkoutPush({ policyRepo, ledgerRepo }, input);

    // Act
    const second = await executeWorkoutPush({ policyRepo, ledgerRepo }, input);

    // Assert
    expect(pushFn).toHaveBeenCalledOnce();
    expect(second.outcome).toBe("skipped");
    expect(ledgerRepo.store.size).toBe(1);
  });
});
