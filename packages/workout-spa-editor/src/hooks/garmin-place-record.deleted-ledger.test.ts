/**
 * Characterisation (H18, step 0 of the scheduled-lifecycle change): a
 * Garmin ledger row whose `kaiordRecordId` no longer resolves to a workout
 * (deleted in Kaiord) is never acted on. "Send week" selects its candidates
 * from the live workouts, and a candidate deleted after selection ends
 * `record-deleted` before its ledger row is even read: no library push, no
 * calendar call, no removal-queue drain, and the row stays byte-identical.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { selectWeekPushCandidates } from "../application/garmin-bulk/select-week-push-candidates";
import { sendWeekToGarmin } from "../application/garmin-bulk/send-week-to-garmin";
import { recordDeleted } from "../application/garmin-placement/placement-result";
import { makeWorkoutRecord } from "../application/test-helpers";
import { createInMemoryPersistence } from "../test-utils/in-memory-persistence";
import {
  createPlacementHarness,
  D1,
  D2,
  RECORD_ID,
} from "../test-utils/placement-harness";
import type { KRD } from "../types/krd";
import { placeRecordResult } from "./garmin-place-record";

vi.mock("../utils/export-workout-formats", () => ({
  exportGcnWorkout: async () => ({}),
}));
vi.mock("../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({}),
}));
vi.mock(
  "../application/integration-policy/resolve-export-policies.use-case",
  () => ({
    resolveExportPolicies: async () => [
      {
        id: "00000000-0000-0000-0000-000000000001",
        profileId: "p1",
        dataType: "workout",
        bridgeId: "garmin-bridge",
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: "2026-05-01T00:00:00.000Z",
      },
    ],
  })
);

const T0 = new Date("2026-10-01T08:00:00.000Z");
const LIVE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

/** The deleted workout's row: `Placed` on D2, a pending `retire` for D1. */
const harnessWithOrphanRow = async () => {
  const h = createPlacementHarness();
  await h.push(D1);
  h.calendar.scripts.unschedule.push({ ok: false, status: 500 });
  await h.push(D2);
  return h;
};

const pushWorkout = async () => ({ success: true, garminWorkoutId: "1" });

describe("send week with a ledger row whose workout was deleted", () => {
  it("should never select, read or drain the orphan row", async () => {
    // Arrange
    const h = await harnessWithOrphanRow();
    const orphan = await h.row();
    const persistence = createInMemoryPersistence();
    await persistence.workouts.put(
      makeWorkoutRecord({
        id: LIVE_ID,
        profileId: "p1",
        date: D2,
        state: "ready",
        krd: {} as KRD,
      })
    );
    const selected = selectWeekPushCandidates([
      ...(await persistence.workouts.getByDateRange(D1, D2)),
    ]);
    const calls = h.calendar.calls.length;
    const read = vi.spyOn(h.ledgerRepo, "findByNaturalKey");

    // Act
    const run = await sendWeekToGarmin(
      {
        pushOne: (id) =>
          placeRecordResult(persistence, pushWorkout, id, h.deps),
        sleep: h.deps.sleep,
        isCancelled: () => false,
      },
      // A candidate deleted between selection and its turn, too.
      [...selected, { workoutId: RECORD_ID, date: D2 }]
    );

    // Assert
    expect(selected.map((c) => c.workoutId)).toEqual([LIVE_ID]);
    expect(run.outcomes[0]).toMatchObject({
      workoutId: LIVE_ID,
      status: "scheduled",
    });
    expect(run.outcomes.find((o) => o.workoutId === RECORD_ID)).toEqual({
      workoutId: RECORD_ID,
      date: D2,
      status: "failed",
      result: recordDeleted(),
    });
    const readIds = read.mock.calls.map(([key]) => key.kaiordRecordId);
    expect(readIds).toContain(LIVE_ID);
    expect(readIds).not.toContain(RECORD_ID);
    expect(h.calendar.calls.slice(calls)).not.toContainEqual(
      expect.objectContaining({ op: "unschedule" })
    );
    expect(await h.row()).toEqual(orphan);
  });
});
