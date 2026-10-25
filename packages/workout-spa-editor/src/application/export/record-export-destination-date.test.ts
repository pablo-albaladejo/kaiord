/**
 * DR-1/DR-2 — the TrainingPeaks pushed day (`destinationDate`) is written by
 * the single commit patch, so the created and the updated path of
 * `recordExport` must end with the same value for the same payload, and a
 * destination other than TrainingPeaks never gets one on either path.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { TRAININGPEAKS_BRIDGE_ID } from "../trainingpeaks/trainingpeaks-weight-import";
import { buildCommitPatch } from "./build-commit-patch";
import { recordExport } from "./record-export.use-case";

const RECORD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const GARMIN = "garmin-bridge";

type Path = "created" | "updated";

/** For `updated`, a committed row with a stale hash and an older day. */
const seed = (path: Path, bridge: string) => {
  const repo = createInMemoryExportLedgerRepository();
  if (path === "updated") {
    repo.store.set(`${RECORD_ID}\u0000${bridge}`, {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      kaiordRecordId: RECORD_ID,
      dataType: "workout",
      destinationBridgeId: bridge,
      destinationExternalId: "old-id",
      contentHash: "stale-hash",
      exportedAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      ...(bridge === TRAININGPEAKS_BRIDGE_ID && {
        destinationDate: "2026-10-20",
      }),
    });
  }
  return repo;
};

const pushOn = async (
  path: Path,
  bridge: string,
  payload: Record<string, unknown>
) => {
  const repo = seed(path, bridge);
  const result = await recordExport(
    { ledgerRepo: repo },
    {
      kaiordRecordId: RECORD_ID,
      dataType: "workout",
      destinationBridgeId: bridge,
      payload,
      postFn: async () => ({ externalId: "new-id" }),
    }
  );
  return { result, row: [...repo.store.values()][0] };
};

describe("recordExport destinationDate", () => {
  it("should end with the same destinationDate on the created and the updated path", async () => {
    // Arrange
    const payload = { workoutDay: "2026-10-22", title: "Intervals" };

    // Act
    const created = await pushOn("created", TRAININGPEAKS_BRIDGE_ID, payload);
    const updated = await pushOn("updated", TRAININGPEAKS_BRIDGE_ID, payload);

    // Assert
    expect(created.result.outcome).toBe("created");
    expect(updated.result.outcome).toBe("updated");
    expect(created.row?.destinationDate).toBe("2026-10-22");
    expect(updated.row?.destinationDate).toBe(created.row?.destinationDate);
  });

  it.each<Path>(["created", "updated"])(
    "should never give a Garmin row a destinationDate on the %s path",
    async (path) => {
      // Arrange
      const payload = { workoutDay: "2026-10-22", workoutName: "Intervals" };

      // Act
      const { result, row } = await pushOn(path, GARMIN, payload);

      // Assert
      expect(result.outcome).toBe(path);
      expect(row).not.toHaveProperty("destinationDate");
    }
  );

  it.each<Path>(["created", "updated"])(
    "should not invent a destinationDate when the payload has no workoutDay on the %s path",
    async (path) => {
      // Arrange
      const payload = { title: "Intervals" };

      // Act
      const { row } = await pushOn(path, TRAININGPEAKS_BRIDGE_ID, payload);

      // Assert
      expect(row?.destinationDate).toBe(
        path === "updated" ? "2026-10-20" : undefined
      );
    }
  );
});

describe("buildCommitPatch destinationDate", () => {
  const row = (): ExportLedgerEntry =>
    seed("updated", TRAININGPEAKS_BRIDGE_ID).store.values().next()
      .value as ExportLedgerEntry;
  const patchWith = (destinationDate: string | undefined) =>
    buildCommitPatch({
      pushed: { externalId: "new-id" },
      contentHash: "fresh-hash",
      exportedAt: "2026-10-22T08:00:00.000Z",
      destinationDate,
    });

  it("should set the destinationDate it is given", () => {
    // Arrange
    const patch = patchWith("2026-10-22");

    // Act
    const next = patch(row());

    // Assert
    expect(next.destinationDate).toBe("2026-10-22");
  });

  it("should keep the row's destinationDate when given none", () => {
    // Arrange
    const patch = patchWith(undefined);

    // Act
    const next = patch(row());

    // Assert
    expect(next.destinationDate).toBe("2026-10-20");
  });
});
