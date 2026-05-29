/**
 * save-workout export trigger — unit tests.
 *
 * Mocks the resolver + recordExport via ports. No Dexie.
 */
import { describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../types/integration-policy";
import { createEventBus } from "../event-bus/event-bus";
import type { WorkoutEventMap } from "../event-bus/workout-event-bus";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import type { ExportLedgerRepository } from "./export-ledger-repository.port";
import { registerSaveWorkoutExportTrigger } from "./save-workout-export-trigger";

const PROFILE_ID = "00000000-0000-0000-0000-000000000001";
const RECORD_ID = "00000000-0000-0000-0000-000000000002";
const NOW = "2026-05-01T00:00:00.000Z";

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: "00000000-0000-0000-0000-000000000010",
  profileId: PROFILE_ID,
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "auto",
  enabled: true,
  updatedAt: NOW,
  ...overrides,
});

const makePolicyRepo = (
  policies: IntegrationPolicy[]
): IntegrationPolicyRepository => ({
  findByProfileDirection: async () => policies,
  findByNaturalKey: async () => undefined,
  put: async () => undefined,
  deleteById: async () => undefined,
});

const makeLedgerRepo = (): ExportLedgerRepository => ({
  findByNaturalKey: async () => undefined,
  insertPending: async () => ({ ok: true }),
  update: async () => undefined,
  deleteById: async () => undefined,
});

const makeEvent = (): WorkoutEventMap["entitySaved"] => ({
  kaiordRecordId: RECORD_ID,
  profileId: PROFILE_ID,
  dataType: "workout",
  payload: { name: "Morning ride" },
});

describe("registerSaveWorkoutExportTrigger", () => {
  it("should NOT trigger recordExport when no export policy exists", async () => {
    // Arrange
    const bus = createEventBus<WorkoutEventMap>();
    const postFn = vi.fn(async () => ({ externalId: "ext-1" }));
    registerSaveWorkoutExportTrigger({
      bus,
      policyRepo: makePolicyRepo([]),
      ledgerRepo: makeLedgerRepo(),
      postFn,
    });

    // Act
    bus.emit("entitySaved", makeEvent());
    await Promise.resolve();

    // Assert
    expect(postFn).not.toHaveBeenCalled();
  });

  it("should NOT trigger recordExport when policy is mode=manual", async () => {
    // Arrange
    const bus = createEventBus<WorkoutEventMap>();
    const postFn = vi.fn(async () => ({ externalId: "ext-1" }));
    registerSaveWorkoutExportTrigger({
      bus,
      policyRepo: makePolicyRepo([makePolicy({ mode: "manual" })]),
      ledgerRepo: makeLedgerRepo(),
      postFn,
    });

    // Act
    bus.emit("entitySaved", makeEvent());
    await Promise.resolve();

    // Assert
    expect(postFn).not.toHaveBeenCalled();
  });

  it("should trigger recordExport when policy is enabled and mode=auto", async () => {
    // Arrange
    const bus = createEventBus<WorkoutEventMap>();
    const postFn = vi.fn(async () => ({ externalId: "ext-1" }));
    registerSaveWorkoutExportTrigger({
      bus,
      policyRepo: makePolicyRepo([makePolicy()]),
      ledgerRepo: makeLedgerRepo(),
      postFn,
    });

    // Act
    bus.emit("entitySaved", makeEvent());
    // Allow the async handler to settle.
    await new Promise((r) => setTimeout(r, 0));

    // Assert
    expect(postFn).toHaveBeenCalledOnce();
  });

  it("should trigger recordExport once per enabled destination bridge", async () => {
    // Arrange
    const bus = createEventBus<WorkoutEventMap>();
    const postFn = vi.fn(async () => ({ externalId: "ext-x" }));
    const policies = [
      makePolicy({ id: "id-1", bridgeId: "garmin-bridge" }),
      makePolicy({ id: "id-2", bridgeId: "wahoo-bridge" }),
    ];
    registerSaveWorkoutExportTrigger({
      bus,
      policyRepo: makePolicyRepo(policies),
      ledgerRepo: makeLedgerRepo(),
      postFn,
    });

    // Act
    bus.emit("entitySaved", makeEvent());
    await new Promise((r) => setTimeout(r, 0));

    // Assert
    expect(postFn).toHaveBeenCalledTimes(2);
  });
});
