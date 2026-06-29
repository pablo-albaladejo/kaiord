/**
 * Analytics-port instrumentation — unit tests covering the four new
 * integration lifecycle events (plan T-28 / analytics-port delta spec).
 *
 * Uses in-memory port mocks; no Dexie or React dependency.
 *
 * Payload rules (R-PIIInterpolation): every field is structural metadata
 * only — data type, bridge id, direction, outcome, duration. No biometric
 * values, no user-entered metric values, no record content.
 */
import type { Analytics } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import type { ExportLedgerEntry } from "../types/export-ledger";
import type {
  ExportLedgerRepository,
  InsertPendingResult,
} from "./export/export-ledger-repository.port";
import { recordExport } from "./export/record-export.use-case";
import type { ImportedRecordRepository } from "./import/imported-record-repository.port";
import { upsertImportedRecord } from "./import/upsert-imported-record.use-case";
import type { IntegrationPolicyRepository } from "./integration-policy/integration-policy-repository.port";
import { upsertIntegrationPolicy } from "./integration-policy/upsert-integration-policy.use-case";

const PROFILE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const makeAnalytics = (): Analytics & {
  events: { name: string; props: unknown }[];
} => {
  const events: { name: string; props: unknown }[] = [];
  return {
    events,
    pageView: vi.fn(),
    event: (name, props) => {
      events.push({ name, props });
    },
  };
};

// ──────────────────────────────────────────────────────────────────────────
// Integration-policy repo mock
// ──────────────────────────────────────────────────────────────────────────

const makePolicyRepo = (): IntegrationPolicyRepository => ({
  findByNaturalKey: async () => undefined,
  findByProfileDirection: async () => [],
  put: async () => undefined,
  deleteById: async () => undefined,
});

// ──────────────────────────────────────────────────────────────────────────
// Ledger repo mock
// ──────────────────────────────────────────────────────────────────────────

const makeLedgerRepo = (
  overrides: Partial<ExportLedgerRepository> = {}
): ExportLedgerRepository => ({
  findByNaturalKey: async () => undefined,
  insertPending: async (): Promise<InsertPendingResult> => ({ ok: true }),
  update: async () => undefined,
  deleteById: async () => undefined,
  countByDataType: async () => 1,
  ...overrides,
});

const makeStatefulLedgerRepo = (): ExportLedgerRepository => {
  const store = new Map<string, ExportLedgerEntry>();
  const keyIndex = new Map<string, string>();
  const nk = (krd: string, dest: string) => `${krd}::${dest}`;
  return {
    findByNaturalKey: async ({ kaiordRecordId, destinationBridgeId }) => {
      const id = keyIndex.get(nk(kaiordRecordId, destinationBridgeId));
      return id ? store.get(id) : undefined;
    },
    insertPending: async (entry): Promise<InsertPendingResult> => {
      const key = nk(entry.kaiordRecordId, entry.destinationBridgeId);
      if (keyIndex.has(key)) return { ok: false, reason: "constraint" };
      store.set(entry.id, entry);
      keyIndex.set(key, entry.id);
      return { ok: true };
    },
    update: async (id, patch) => {
      const existing = store.get(id);
      if (existing) store.set(id, { ...existing, ...patch });
    },
    deleteById: async (id) => {
      const entry = store.get(id);
      if (entry) {
        keyIndex.delete(nk(entry.kaiordRecordId, entry.destinationBridgeId));
        store.delete(id);
      }
    },
    countByDataType: async (dt) =>
      [...store.values()].filter((e) => e.dataType === dt).length,
  };
};

// ──────────────────────────────────────────────────────────────────────────
// Import repo mock
// ──────────────────────────────────────────────────────────────────────────

const makeImportRepo = (): ImportedRecordRepository => ({
  findByNaturalKey: async () => undefined,
  insert: async () => undefined,
});

const makeImportRepoWithExisting = (): ImportedRecordRepository => ({
  findByNaturalKey: async () => ({
    kaiordRecordId: "existing-id",
    profileId: PROFILE_ID,
    sourceBridgeId: "garmin-bridge",
    externalId: "ext-1",
    payload: {},
    measuredAt: "2026-01-01T00:00:00.000Z",
  }),
  insert: async () => undefined,
});

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe("analytics-port events — integration_policy.toggled", () => {
  it("should emit integration_policy.toggled with action=added when a new policy is upserted", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const policyRepo = makePolicyRepo();

    // Act
    await upsertIntegrationPolicy(
      { policyRepo, analytics },
      {
        profileId: PROFILE_ID,
        dataType: "weight",
        direction: "import",
        bridgeId: "garmin-bridge",
        mode: "manual",
        enabled: true,
      }
    );

    // Assert
    const toggled = analytics.events.find(
      (e) => e.name === "integration_policy.toggled"
    );
    expect(toggled).toBeDefined();
    expect(toggled?.props).toMatchObject({
      profileId: PROFILE_ID,
      dataType: "weight",
      direction: "import",
      bridgeId: "garmin-bridge",
      action: "added",
    });
  });

  it("should emit integration_policy.toggled with action=disabled when an existing policy is disabled", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const existingPolicy = {
      id: "policy-1",
      profileId: PROFILE_ID,
      dataType: "weight" as const,
      direction: "import" as const,
      bridgeId: "garmin-bridge",
      mode: "manual" as const,
      enabled: true,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const policyRepo: IntegrationPolicyRepository = {
      findByNaturalKey: async () => existingPolicy,
      findByProfileDirection: async () => [],
      put: async () => undefined,
      deleteById: async () => undefined,
    };

    // Act
    await upsertIntegrationPolicy(
      { policyRepo, analytics },
      {
        profileId: PROFILE_ID,
        dataType: "weight",
        direction: "import",
        bridgeId: "garmin-bridge",
        mode: "manual",
        enabled: false,
      }
    );

    // Assert
    const toggled = analytics.events.find(
      (e) => e.name === "integration_policy.toggled"
    );
    expect(toggled?.props).toMatchObject({ action: "disabled" });
  });

  it("should emit integration_policy.toggled exactly once per upsert call", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const policyRepo = makePolicyRepo();

    // Act
    await upsertIntegrationPolicy(
      { policyRepo, analytics },
      {
        profileId: PROFILE_ID,
        dataType: "workout",
        direction: "export",
        bridgeId: "garmin-bridge",
        mode: "auto",
        enabled: true,
      }
    );

    // Assert
    expect(
      analytics.events.filter((e) => e.name === "integration_policy.toggled")
    ).toHaveLength(1);
  });
});

describe("analytics-port events — import_completed", () => {
  it("should emit import_completed with outcome=inserted on a new record", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const recordRepo = makeImportRepo();

    // Act
    await upsertImportedRecord(
      { recordRepo, analytics },
      {
        profileId: PROFILE_ID,
        dataType: "weight",
        sourceBridgeId: "garmin-bridge",
        externalId: "ext-1",
        date: "2026-01-01",
        payload: {},
        measuredAt: "2026-01-01T08:00:00.000Z",
      }
    );

    // Assert
    const ev = analytics.events.find((e) => e.name === "import_completed");
    expect(ev).toBeDefined();
    expect(ev?.props).toMatchObject({
      profileId: PROFILE_ID,
      dataType: "weight",
      bridgeId: "garmin-bridge",
      outcome: "inserted",
    });
    expect(typeof (ev?.props as Record<string, unknown>)["durationMs"]).toBe(
      "number"
    );
  });

  it("should emit import_completed with outcome=deduplicated on second import of same record", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const recordRepo = makeImportRepoWithExisting();

    // Act
    await upsertImportedRecord(
      { recordRepo, analytics },
      {
        profileId: PROFILE_ID,
        dataType: "weight",
        sourceBridgeId: "garmin-bridge",
        externalId: "ext-1",
        date: "2026-01-01",
        payload: {},
        measuredAt: "2026-01-01T08:00:00.000Z",
      }
    );

    // Assert
    const ev = analytics.events.find((e) => e.name === "import_completed");
    expect(ev?.props).toMatchObject({ outcome: "deduplicated" });
    const durationMs = (ev?.props as Record<string, unknown>)["durationMs"];
    expect(typeof durationMs).toBe("number");
    expect(durationMs as number).toBeGreaterThanOrEqual(0);
  });
});

describe("analytics-port events — export_completed", () => {
  it("should emit export_completed with outcome=posted on first export", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const ledgerRepo = makeLedgerRepo();
    const postFn = vi.fn().mockResolvedValue({ externalId: "ext-1" });

    // Act
    await recordExport(
      { ledgerRepo, analytics },
      {
        kaiordRecordId: "rec-1",
        dataType: "workout",
        destinationBridgeId: "garmin-bridge",
        payload: {},
        postFn,
      }
    );

    // Assert
    const ev = analytics.events.find((e) => e.name === "export_completed");
    expect(ev).toBeDefined();
    expect(ev?.props).toMatchObject({
      dataType: "workout",
      destinationBridgeId: "garmin-bridge",
      outcome: "posted",
    });
    const durationMs = (ev?.props as Record<string, unknown>)["durationMs"];
    expect(typeof durationMs).toBe("number");
    expect(durationMs as number).toBeGreaterThanOrEqual(0);
  });

  it("should emit export_completed with outcome=skipped when content hash is unchanged", async () => {
    // Arrange
    const analytics = makeAnalytics();
    const postFn = vi.fn().mockResolvedValue({ externalId: "ext-1" });
    const ledgerRepo = makeStatefulLedgerRepo();

    await recordExport(
      { ledgerRepo, analytics },
      {
        kaiordRecordId: "rec-1",
        dataType: "workout",
        destinationBridgeId: "garmin-bridge",
        payload: { name: "ride" },
        postFn,
      }
    );
    analytics.events.length = 0;

    // Act
    await recordExport(
      { ledgerRepo, analytics },
      {
        kaiordRecordId: "rec-1",
        dataType: "workout",
        destinationBridgeId: "garmin-bridge",
        payload: { name: "ride" },
        postFn,
      }
    );

    // Assert
    const ev = analytics.events.find((e) => e.name === "export_completed");
    expect(ev?.props).toMatchObject({ outcome: "skipped" });
  });
});

describe("analytics-port events — kaiord.export.ledger.size gauge", () => {
  it("should emit kaiord.export.ledger.size after every export_completed", async () => {
    // Arrange
    const STUB_LEDGER_COUNT = 42;
    const analytics = makeAnalytics();
    const ledgerRepo = makeLedgerRepo({
      countByDataType: async () => STUB_LEDGER_COUNT,
    });
    const postFn = vi.fn().mockResolvedValue({ externalId: "ext-1" });

    // Act
    await recordExport(
      { ledgerRepo, analytics },
      {
        kaiordRecordId: "rec-1",
        dataType: "workout",
        destinationBridgeId: "garmin-bridge",
        payload: {},
        postFn,
      }
    );

    // Assert
    const gauge = analytics.events.find(
      (e) => e.name === "kaiord.export.ledger.size"
    );
    expect(gauge).toBeDefined();
    expect(gauge?.props).toMatchObject({
      dataType: "workout",
      count: STUB_LEDGER_COUNT,
    });
  });
});
