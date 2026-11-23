import { describe, expect, it } from "vitest";

import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import { LEDGER_KEY, RECORD_ID } from "../../test-utils/placement-harness";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { GARMIN_LEDGER_BRIDGE_ID } from "../../types/export-ledger";
import type {
  GarminScheduleId,
  GarminWorkoutId,
} from "../../types/garmin-ledger";
import { commitPlacement, placedFrom } from "./placement-commit";
import type { PlacementRun } from "./placement-deps";
import { revived } from "./placement-revival";
import type { Attempt } from "./placement-row";

const W = "1707805999" as GarminWorkoutId;
const X = "1792000000" as GarminScheduleId;
const DATE = "2026-10-06";
const AT = "2026-10-01T08:00:00.000Z";

const attempt: Attempt = {
  kind: "attempting",
  workoutId: W,
  date: DATE,
  at: AT,
  posted: false,
  supersedes: [X],
};

const deletedX = {
  workoutScheduleId: X,
  workoutId: W,
  date: DATE,
  attempts: 0,
  abandoned: false,
  state: "gone" as const,
  created: true as const,
  deleted: true as const,
};

describe("commitPlacement", () => {
  it("should write nothing when the entry it revives was seen deleted since the read", async () => {
    // Arrange
    const row = {
      id: "row-1",
      kaiordRecordId: RECORD_ID,
      destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
      placement: attempt,
      removalQueue: [deletedX],
    } as unknown as ExportLedgerEntry;
    const ledgerRepo = createInMemoryExportLedgerRepository();
    await ledgerRepo.insertPending(row);
    const run = {
      deps: { ledgerRepo, now: () => Date.parse(AT) },
      key: LEDGER_KEY,
    } as unknown as PlacementRun;
    const stillGone = { ...deletedX, deleted: undefined };

    // Act
    const verdict = await commitPlacement(
      run,
      attempt,
      placedFrom(attempt, X),
      undefined,
      {
        own: revived(stillGone, "keep"),
      }
    );

    // Assert
    expect(verdict).toBe("stale");
    expect((await ledgerRepo.findByNaturalKey(LEDGER_KEY))?.placement).toEqual(
      attempt
    );
  });
});
