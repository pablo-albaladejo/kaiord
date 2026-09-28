/**
 * AC-11 / AC-17 — the constraint path checks `pending` before the content
 * hash, honours `forceRepush`, recovers a stale pending row, and a failed
 * library push leaves the ledger as it found it on both paths.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryExportLedgerRepository } from "../../test-utils/in-memory-export-ledger-repository";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { recordExport } from "./record-export.use-case";
import { computeExportHash } from "./record-export-analytics";
import { PENDING_TTL_MS } from "./record-export-constraint";

const RECORD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BRIDGE = "garmin-bridge";
const PAYLOAD = { workoutName: "Intervals" };
const HASH = computeExportHash("workout", PAYLOAD);
const NOW = new Date("2026-09-28T10:00:00.000Z");
const KEY = `${RECORD_ID}\u0000${BRIDGE}`;

const ONE_SECOND_MS = 1000;
const FAR_FUTURE_TTLS = 10;

const ageBy = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const seeded = (overrides: Partial<ExportLedgerEntry>) => {
  const repo = createInMemoryExportLedgerRepository();
  repo.store.set(KEY, {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    kaiordRecordId: RECORD_ID,
    dataType: "workout",
    destinationBridgeId: BRIDGE,
    destinationExternalId: "1000000001",
    contentHash: HASH,
    exportedAt: ageBy(ONE_SECOND_MS),
    updatedAt: ageBy(ONE_SECOND_MS),
    library: { kind: "confirmed", workoutId: "1000000001" },
    ...overrides,
  } as ExportLedgerEntry);
  return repo;
};

const run = (
  repo: ReturnType<typeof seeded>,
  postFn = vi.fn().mockResolvedValue({ externalId: "1707805999" })
) =>
  recordExport(
    { ledgerRepo: repo },
    {
      kaiordRecordId: RECORD_ID,
      dataType: "workout",
      destinationBridgeId: BRIDGE,
      payload: PAYLOAD,
      postFn,
    }
  ).then((result) => ({ result, postFn }));

describe("recordExport constraint ordering", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return lost-race, not skipped, for an equal-hash push racing a pending row", async () => {
    // Arrange
    const repo = seeded({
      destinationExternalId: "pending",
      library: undefined,
    });

    // Act
    const { result, postFn } = await run(repo);

    // Assert
    expect(result.outcome).toBe("lost-race");
    expect(result.externalId).toBeUndefined();
    expect(postFn).not.toHaveBeenCalled();
  });

  it("should re-push an equal-hash row flagged forceRepush and clear the flag", async () => {
    // Arrange
    const repo = seeded({ forceRepush: true });

    // Act
    const { result, postFn } = await run(repo);

    // Assert
    expect(result.outcome).toBe("updated");
    expect(postFn).toHaveBeenCalledOnce();
    expect(repo.store.get(KEY)).not.toHaveProperty("forceRepush");
  });

  it("should skip an equal-hash committed row and report its library", async () => {
    // Arrange
    const repo = seeded({});

    // Act
    const { result, postFn } = await run(repo);

    // Assert
    expect(result.outcome).toBe("skipped");
    expect(result.library).toEqual({
      kind: "confirmed",
      workoutId: "1000000001",
    });
    expect(postFn).not.toHaveBeenCalled();
  });

  it("should recover a pending row older than the TTL by re-pushing it", async () => {
    // Arrange
    const stale = ageBy(PENDING_TTL_MS + 1);
    const repo = seeded({
      destinationExternalId: "pending",
      exportedAt: stale,
      library: undefined,
    });

    // Act
    const { result, postFn } = await run(repo);

    // Assert
    expect(result.outcome).toBe("updated");
    expect(postFn).toHaveBeenCalledOnce();
    expect(repo.store.get(KEY)?.destinationExternalId).toBe("1707805999");
  });

  it.each([
    ["fresh", ageBy(PENDING_TTL_MS - 1)],
    [
      "future (clamped to now)",
      new Date(NOW.getTime() + PENDING_TTL_MS * FAR_FUTURE_TTLS).toISOString(),
    ],
  ])(
    "should keep a %s pending row as lost-race",
    async (_label, exportedAt) => {
      // Arrange
      const repo = seeded({
        destinationExternalId: "pending",
        exportedAt,
        library: undefined,
      });

      // Act
      const { result, postFn } = await run(repo);

      // Assert
      expect(result.outcome).toBe("lost-race");
      expect(postFn).not.toHaveBeenCalled();
    }
  );
});

describe("recordExport library push failure", () => {
  it("should delete the pending row when the created-path push fails", async () => {
    // Arrange
    const repo = createInMemoryExportLedgerRepository();
    const postFn = vi.fn().mockRejectedValue(new Error("bridge down"));

    // Act
    const outcome = run(repo, postFn);

    // Assert
    await expect(outcome).rejects.toThrow("bridge down");
    expect(repo.store.size).toBe(0);
  });

  it("should leave the row byte-identical when the updated-path push fails", async () => {
    // Arrange
    const repo = seeded({ contentHash: "stale-hash", forceRepush: true });
    const before = structuredClone(repo.store.get(KEY));
    const postFn = vi.fn().mockRejectedValue(new Error("bridge down"));

    // Act
    const outcome = run(repo, postFn);

    // Assert
    await expect(outcome).rejects.toThrow("bridge down");
    expect(repo.store.get(KEY)).toStrictEqual(before);
  });
});
