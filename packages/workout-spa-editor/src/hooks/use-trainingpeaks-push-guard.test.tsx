/**
 * The moved/changed re-push guard through the real export ledger: the session
 * probe still runs (it supplies the athlete id the payload hash covers), but a
 * blocked push sends no workout write to the bridge.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../types/calendar-record";
import type { ExportLedgerEntry } from "../types/export-ledger";
import { ledgerRepo } from "./trainingpeaks-push-fn";
import { useTrainingPeaksPush } from "./use-trainingpeaks-push";

const mocks = vi.hoisted(() => ({
  checkSession: vi.fn(),
  pushWorkout: vi.fn(),
}));

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: () => "tp-extension" },
}));

vi.mock("../adapters/trainingpeaks/trainingpeaks-transport", () => ({
  checkTrainingPeaksSession: mocks.checkSession,
}));

vi.mock("@kaiord/trainingpeaks", () => ({
  krdToTrainingPeaksWorkout: (
    krd: { steps: number },
    options: { athleteId: number; workoutDay: string }
  ) => ({ ...options, steps: krd.steps }),
}));

vi.mock("../contexts", () => ({ useAnalytics: () => ({ event: vi.fn() }) }));

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ profile: { sportZones: [] } }),
}));

vi.mock("./trainingpeaks-push-fn", async () => {
  const { createInMemoryExportLedgerRepository } =
    await import("../test-utils/in-memory-export-ledger-repository");
  const policy = { enabled: true, bridgeId: "trainingpeaks-bridge" };
  return {
    TRAININGPEAKS_BRIDGE_ID: "trainingpeaks-bridge",
    ledgerRepo: createInMemoryExportLedgerRepository(),
    policyRepo: { findByProfileDirection: async () => [policy] },
    buildTrainingPeaksPushFn:
      (extensionId: string) => async (payload: Record<string, unknown>) => ({
        externalId: String(await mocks.pushWorkout(extensionId, payload)),
      }),
  };
});

const FIRST_TP_ID = 111;
const COPY_TP_ID = 222;
const EDITED_STEPS = 5;
const TUESDAY = "2026-10-20";
const THURSDAY = "2026-10-22";

const record = (date: string, steps = 3) =>
  ({
    id: "w1",
    profileId: "p1",
    date,
    sport: "cycling",
    krd: { type: "workout", steps },
  }) as unknown as WorkoutRecord;

const store = (ledgerRepo as unknown as { store: Map<string, unknown> }).store;

const pushOnce = (workout: WorkoutRecord, allowCopy?: boolean) =>
  renderHook(() => useTrainingPeaksPush(workout)).result.current.push(
    allowCopy === undefined ? undefined : { allowCopy }
  );

const tpRow = async () =>
  ledgerRepo.findByNaturalKey({
    kaiordRecordId: "w1",
    destinationBridgeId: "trainingpeaks-bridge",
  }) as Promise<ExportLedgerEntry | undefined>;

describe("useTrainingPeaksPush re-push guard", () => {
  beforeEach(async () => {
    store.clear();
    mocks.checkSession.mockResolvedValue({
      authenticated: true,
      athleteId: 4242,
    });
    mocks.pushWorkout.mockResolvedValue(FIRST_TP_ID);
    await pushOnce(record(TUESDAY));
    vi.clearAllMocks();
    mocks.checkSession.mockResolvedValue({
      authenticated: true,
      athleteId: 4242,
    });
    mocks.pushWorkout.mockResolvedValue(COPY_TP_ID);
  });

  it("should block a moved workout after the probe and send no workout write", async () => {
    // Arrange
    const moved = record(THURSDAY);

    // Act
    const outcome = await pushOnce(moved);

    // Assert
    expect(outcome).toEqual({
      ok: false,
      block: { blocked: true, reason: "moved", recordedDate: TUESDAY },
    });
    expect(mocks.checkSession).toHaveBeenCalledTimes(1);
    expect(mocks.pushWorkout).not.toHaveBeenCalled();
  });

  it("should block an edited workout on the same day as changed", async () => {
    // Arrange
    const edited = record(TUESDAY, EDITED_STEPS);

    // Act
    const outcome = await pushOnce(edited);

    // Assert
    expect(outcome).toMatchObject({ ok: false, block: { reason: "changed" } });
    expect(mocks.pushWorkout).not.toHaveBeenCalled();
  });

  it("should send exactly one copy and record the new day once confirmed", async () => {
    // Arrange
    const moved = record(THURSDAY);

    // Act
    const outcome = await pushOnce(moved, true);

    // Assert
    expect(outcome).toEqual({ ok: true, workoutId: String(COPY_TP_ID) });
    expect(mocks.pushWorkout).toHaveBeenCalledTimes(1);
    expect((await tpRow())?.destinationDate).toBe(THURSDAY);
  });

  it("should keep an unchanged re-send as the existing skip", async () => {
    // Arrange
    const same = record(TUESDAY);

    // Act
    const outcome = await pushOnce(same);

    // Assert
    expect(outcome).toEqual({ ok: true, workoutId: String(FIRST_TP_ID) });
    expect(mocks.pushWorkout).not.toHaveBeenCalled();
  });
});
