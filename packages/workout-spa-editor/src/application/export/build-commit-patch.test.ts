/**
 * AC-10 — `buildCommitPatch` is the only commit patch, on BOTH the created
 * and the updated path of `recordExport`.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import {
  type GarminLibraryState,
  parseGarminWorkoutId,
} from "../../types/garmin-ledger";
import { buildCommitPatch, type ExportPushResult } from "./build-commit-patch";
import { recordExport } from "./record-export.use-case";

const RECORD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BRIDGE = "garmin-bridge";
const OLD_ID = parseGarminWorkoutId("1000000001");
const NEW_ID = parseGarminWorkoutId("1707805999");
const CONFIRMED: GarminLibraryState = { kind: "confirmed", workoutId: NEW_ID! };
const PREVIOUS: GarminLibraryState = { kind: "confirmed", workoutId: OLD_ID! };

type Path = "created" | "updated";

/** A repo holding, for `updated`, a committed row with a different hash. */
const seed = (path: Path, extra: Partial<ExportLedgerEntry> = {}) => {
  const repo = createInMemoryExportLedgerRepository();
  if (path === "updated") {
    repo.store.set(`${RECORD_ID}\u0000${BRIDGE}`, {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      kaiordRecordId: RECORD_ID,
      dataType: "workout",
      destinationBridgeId: BRIDGE,
      destinationExternalId: OLD_ID!,
      contentHash: "stale-hash",
      exportedAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-01T08:00:00.000Z",
      library: PREVIOUS,
      ...extra,
    });
  }
  return repo;
};

const push = (repo: ReturnType<typeof seed>, pushed: ExportPushResult) =>
  recordExport(
    { ledgerRepo: repo },
    {
      kaiordRecordId: RECORD_ID,
      dataType: "workout",
      destinationBridgeId: BRIDGE,
      payload: { workoutName: "Intervals" },
      postFn: async () => pushed,
    }
  );

const onlyRow = (repo: ReturnType<typeof seed>) => [...repo.store.values()][0];

describe("buildCommitPatch through recordExport", () => {
  it.each<Path>(["created", "updated"])(
    "should persist the pushed library state on the %s path",
    async (path) => {
      // Arrange
      const repo = seed(path);

      // Act
      const result = await push(repo, {
        externalId: NEW_ID!,
        library: CONFIRMED,
      });

      // Assert
      expect(result.outcome).toBe(path);
      expect(result.library).toEqual(CONFIRMED);
      expect(onlyRow(repo)?.library).toEqual(CONFIRMED);
      expect(onlyRow(repo)?.destinationExternalId).toBe(NEW_ID);
    }
  );

  it.each<Path>(["created", "updated"])(
    "should clear forceRepush on the %s path",
    async (path) => {
      // Arrange
      const repo = seed(path, { forceRepush: true, contentHash: "any" });
      const racingRow = { forceRepush: true as const };
      const pushed = async (): Promise<ExportPushResult> => {
        // On the created path, a sync lands a forced row mid-POST.
        await repo.mutateByKey(
          { kaiordRecordId: RECORD_ID, destinationBridgeId: BRIDGE },
          (row) => row && { ...row, ...racingRow }
        );
        return { externalId: NEW_ID!, library: CONFIRMED };
      };

      // Act
      await recordExport(
        { ledgerRepo: repo },
        {
          kaiordRecordId: RECORD_ID,
          dataType: "workout",
          destinationBridgeId: BRIDGE,
          payload: { workoutName: "Intervals" },
          postFn: pushed,
        }
      );

      // Assert
      expect(onlyRow(repo)).not.toHaveProperty("forceRepush");
    }
  );

  it.each<Path>(["created", "updated"])(
    "should record an unconfirmed library when Garmin echoes no usable id on the %s path",
    async (path) => {
      // Arrange
      const repo = seed(path);

      // Act
      await push(repo, {
        externalId: "garmin-unconfirmed",
        library: { kind: "unconfirmed" },
      });

      // Assert
      expect(onlyRow(repo)?.library).toEqual({ kind: "unconfirmed" });
    }
  );

  it.each<Path>(["created", "updated"])(
    "should leave the library untouched when the push reports none on the %s path",
    async (path) => {
      // Arrange
      const repo = seed(path);
      const before = onlyRow(repo)?.library;

      // Act
      await push(repo, { externalId: "tp-42" });

      // Assert
      expect(onlyRow(repo)?.library).toEqual(before);
      expect(onlyRow(repo)?.destinationExternalId).toBe("tp-42");
    }
  );
});

describe("buildCommitPatch", () => {
  it("should keep every unrelated field of the row it patches", () => {
    // Arrange
    const row = {
      ...(seed("updated").store.values().next().value as ExportLedgerEntry),
      forceRepush: true as const,
    };
    const patch = buildCommitPatch({
      pushed: { externalId: NEW_ID!, library: CONFIRMED },
      contentHash: "fresh-hash",
      exportedAt: "2026-09-28T08:00:00.000Z",
    });

    // Act
    const next = patch(row);

    // Assert
    expect(next).not.toHaveProperty("forceRepush");
    expect(next).toEqual({
      ...row,
      forceRepush: undefined,
      destinationExternalId: NEW_ID,
      contentHash: "fresh-hash",
      exportedAt: "2026-09-28T08:00:00.000Z",
      library: CONFIRMED,
    });
  });
});
