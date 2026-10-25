import { describe, expect, it } from "vitest";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import { trainingPeaksRepushGuard } from "./trainingpeaks-repush-guard";

const PUSHED_HASH = "hash-pushed";
const NEW_HASH = "hash-new";
const TUESDAY = "2026-10-20";
const THURSDAY = "2026-10-22";

const row = (
  overrides: Partial<ExportLedgerEntry> = {}
): ExportLedgerEntry => ({
  id: "ledger-1",
  kaiordRecordId: "w1",
  dataType: "workout",
  destinationBridgeId: "trainingpeaks-bridge",
  destinationExternalId: "987654",
  contentHash: PUSHED_HASH,
  exportedAt: "2026-10-19T08:00:00.000Z",
  updatedAt: "2026-10-19T08:00:00.000Z",
  destinationDate: TUESDAY,
  ...overrides,
});

describe("trainingPeaksRepushGuard", () => {
  it.each([
    { scenario: "no row exists", ledger: undefined, hash: NEW_HASH },
    {
      scenario: "the row is still pending",
      ledger: row({ destinationExternalId: "pending" }),
      hash: NEW_HASH,
    },
    {
      scenario: "the payload hash is unchanged (the existing skip)",
      ledger: row(),
      hash: PUSHED_HASH,
    },
    // forceRepush means the destination lost its copy: sending again is the
    // repair, not a duplicate, so the guard steps aside.
    {
      scenario: "the row is flagged for a forced re-push",
      ledger: row({ forceRepush: true }),
      hash: NEW_HASH,
    },
  ])("should not block when $scenario", ({ ledger, hash }) => {
    // Arrange
    const workout = { date: THURSDAY };

    // Act
    const verdict = trainingPeaksRepushGuard(ledger, workout, hash);

    // Assert
    expect(verdict).toEqual({ blocked: false });
  });

  it("should block as moved and name the recorded day when the date changed", () => {
    // Arrange
    const workout = { date: THURSDAY };

    // Act
    const verdict = trainingPeaksRepushGuard(row(), workout, NEW_HASH);

    // Assert
    expect(verdict).toEqual({
      blocked: true,
      reason: "moved",
      recordedDate: TUESDAY,
    });
  });

  it.each([
    { scenario: "the date is unchanged", ledger: row(), date: TUESDAY },
    {
      scenario: "the row predates the recorded day",
      ledger: row({ destinationDate: undefined }),
      date: THURSDAY,
    },
  ])("should block as changed when $scenario", ({ ledger, date }) => {
    // Arrange
    const workout = { date };

    // Act
    const verdict = trainingPeaksRepushGuard(ledger, workout, NEW_HASH);

    // Assert
    expect(verdict).toEqual({ blocked: true, reason: "changed" });
  });
});
