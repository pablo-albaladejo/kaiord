/**
 * Tests for recordExport use case — the insert-pending → POST → UPDATE protocol.
 * Uses in-memory port mocks — no Dexie dependency.
 */
import { describe, expect, it, vi } from "vitest";

import type { ExportLedgerEntry } from "../../types/export-ledger";
import type {
  ExportLedgerRepository,
  InsertPendingResult,
} from "./export-ledger-repository.port";
import { recordExport } from "./record-export.use-case";

const KAIO_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DEST_BRIDGE = "garmin-bridge";
const PAYLOAD = { weightKilograms: 75 };

const makeRepo = (): ExportLedgerRepository & {
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
    insertPending: async (entry): Promise<InsertPendingResult> => {
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

describe("recordExport", () => {
  it("should POST and create a ledger entry on first call", async () => {
    // Arrange
    const postFn = vi.fn().mockResolvedValue({ externalId: "ext-001" });
    const ledgerRepo = makeRepo();
    const deps = { ledgerRepo };

    // Act
    const result = await recordExport(deps, {
      kaiordRecordId: KAIO_ID,
      dataType: "weight",
      destinationBridgeId: DEST_BRIDGE,
      payload: PAYLOAD,
      postFn,
    });

    // Assert
    expect(postFn).toHaveBeenCalledOnce();
    expect(result.outcome).toBe("created");
    expect(ledgerRepo.store.size).toBe(1);
    const entry = [...ledgerRepo.store.values()][0];
    expect(entry?.destinationExternalId).toBe("ext-001");
  });

  it("should skip POST when contentHash matches existing committed entry", async () => {
    // Arrange
    const postFn = vi.fn().mockResolvedValue({ externalId: "ext-001" });
    const ledgerRepo = makeRepo();
    const deps = { ledgerRepo };
    await recordExport(deps, {
      kaiordRecordId: KAIO_ID,
      dataType: "weight",
      destinationBridgeId: DEST_BRIDGE,
      payload: PAYLOAD,
      postFn,
    });
    postFn.mockClear();

    // Act
    const result = await recordExport(deps, {
      kaiordRecordId: KAIO_ID,
      dataType: "weight",
      destinationBridgeId: DEST_BRIDGE,
      payload: PAYLOAD,
      postFn,
    });

    // Assert
    expect(postFn).not.toHaveBeenCalled();
    expect(result.outcome).toBe("skipped");
  });

  it("should update the ledger entry when contentHash differs from existing committed entry", async () => {
    // Arrange
    const postFn = vi
      .fn()
      .mockResolvedValueOnce({ externalId: "ext-001" })
      .mockResolvedValueOnce({ externalId: "ext-002" });
    const ledgerRepo = makeRepo();
    const deps = { ledgerRepo };
    await recordExport(deps, {
      kaiordRecordId: KAIO_ID,
      dataType: "weight",
      destinationBridgeId: DEST_BRIDGE,
      payload: PAYLOAD,
      postFn,
    });

    // Act
    const result = await recordExport(deps, {
      kaiordRecordId: KAIO_ID,
      dataType: "weight",
      destinationBridgeId: DEST_BRIDGE,
      payload: { weightKilograms: 80 },
      postFn,
    });

    // Assert
    expect(result.outcome).toBe("updated");
    expect(ledgerRepo.store.size).toBe(1);
    const entry = [...ledgerRepo.store.values()][0];
    expect(entry?.destinationExternalId).toBe("ext-002");
  });

  it("should DELETE the pending ledger row when postFn throws", async () => {
    // Arrange
    const postFn = vi.fn().mockRejectedValue(new Error("network error"));
    const ledgerRepo = makeRepo();
    const deps = { ledgerRepo };

    // Act
    let error: unknown;
    try {
      await recordExport(deps, {
        kaiordRecordId: KAIO_ID,
        dataType: "weight",
        destinationBridgeId: DEST_BRIDGE,
        payload: PAYLOAD,
        postFn,
      });
    } catch (e) {
      error = e;
    }

    // Assert
    expect(error).toBeDefined();
    expect(ledgerRepo.store.size).toBe(0);
  });

  it("should return lost-race when another caller has a pending row", async () => {
    // Arrange
    const existingId = crypto.randomUUID();
    const freshRepo = makeRepo();
    await freshRepo.insertPending({
      id: existingId,
      kaiordRecordId: KAIO_ID,
      dataType: "weight",
      destinationBridgeId: DEST_BRIDGE,
      destinationExternalId: "pending",
      contentHash: "different-hash",
      exportedAt: new Date().toISOString(),
    });
    const postFn = vi.fn().mockResolvedValue({ externalId: "ext-001" });

    // Act
    const result = await recordExport(
      { ledgerRepo: freshRepo },
      {
        kaiordRecordId: KAIO_ID,
        dataType: "weight",
        destinationBridgeId: DEST_BRIDGE,
        payload: PAYLOAD,
        postFn,
      }
    );

    // Assert
    expect(postFn).not.toHaveBeenCalled();
    expect(result.outcome).toBe("lost-race");
  });
});
