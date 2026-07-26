import type { KRD } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { createInMemoryImportedRecordRepository } from "../../test-utils/in-memory-imported-record-repository";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  syncTanitaImport,
  type SyncTanitaImportDeps,
} from "./sync-tanita-import.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const MEASURED_AT = "2026-07-20T08:00:00.000Z";
const WEIGHT_KG = 75.2;
const BODY_FAT_PERCENT = 18.5;
const BOTH_EXTENSIONS = 2;

/** One MyTANITA row → ONE KRD carrying BOTH health extensions. */
const tanitaKrd = (): KRD => ({
  version: "2.0",
  type: "weight_measurement",
  metadata: { created: MEASURED_AT, manufacturer: "tanita" },
  extensions: {
    health: {
      weight: {
        kind: "weight",
        version: "2.0",
        measuredAt: MEASURED_AT,
        weightKilograms: WEIGHT_KG,
      },
      bodyComposition: {
        kind: "bodyComposition",
        version: "2.0",
        measuredAt: MEASURED_AT,
        bodyFatPercent: BODY_FAT_PERCENT,
      },
    },
  },
});

const makePolicy = (
  overrides: Partial<IntegrationPolicy> = {}
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "weight",
  bridgeId: "tanita-bridge",
  direction: "import",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-07-20T00:00:00.000Z",
  ...overrides,
});

const makePolicyRepo = (
  rows: IntegrationPolicy[]
): IntegrationPolicyRepository => ({
  findByProfileDirection: async ({ profileId, dataType, direction }) =>
    rows.filter(
      (r) =>
        r.profileId === profileId &&
        r.dataType === dataType &&
        r.direction === direction
    ),
  findByNaturalKey: async () => undefined,
  put: async () => undefined,
  deleteById: async () => undefined,
});

const emptyStores = () => ({
  weight: new Map(),
  sleep: new Map(),
  hrv: new Map(),
  "daily-wellness": new Map(),
  "body-composition": new Map(),
  stress: new Map(),
});

const makeDeps = (
  policies: IntegrationPolicy[],
  readCsv: SyncTanitaImportDeps["readCsv"],
  stores = emptyStores()
): { deps: SyncTanitaImportDeps; stores: ReturnType<typeof emptyStores> } => {
  return {
    deps: {
      policyRepo: makePolicyRepo(policies),
      importedRecords: createInMemoryImportedRecordRepository(stores),
      readCsv,
      parse: () => [tanitaKrd()],
    },
    stores,
  };
};

const input = { profileId: PROFILE_ID };
const bodyCompositionPolicy = makePolicy({ dataType: "body-composition" });

describe("syncTanitaImport", () => {
  it("should be a no-op when neither tanita import route is enabled", async () => {
    // Arrange
    const readCsv = vi.fn();
    const { deps, stores } = makeDeps(
      [makePolicy({ enabled: false }), makePolicy({ enabled: false })],
      readCsv
    );

    // Act
    const result = await syncTanitaImport(deps, input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-policy" });
    expect(readCsv).not.toHaveBeenCalled();
    expect(stores.weight.size).toBe(0);
  });

  it("should persist both extensions of a single KRD when both routes are enabled", async () => {
    // Arrange
    const readCsv = vi.fn().mockResolvedValue("csv");
    const { deps, stores } = makeDeps(
      [makePolicy(), bodyCompositionPolicy],
      readCsv
    );

    // Act
    const result = await syncTanitaImport(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: BOTH_EXTENSIONS, skipped: 0 });
    expect(stores.weight.size).toBe(1);
    expect(stores["body-composition"].size).toBe(1);
  });

  it("should persist only the weight half when body-composition is disabled", async () => {
    // Arrange
    const readCsv = vi.fn().mockResolvedValue("csv");
    const { deps, stores } = makeDeps(
      [
        makePolicy(),
        makePolicy({ dataType: "body-composition", enabled: false }),
      ],
      readCsv
    );

    // Act
    const result = await syncTanitaImport(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 1, skipped: 0 });
    expect(stores.weight.size).toBe(1);
    expect(stores["body-composition"].size).toBe(0);
  });

  it("should skip both already-imported extensions on a second run", async () => {
    // Arrange
    const readCsv = vi.fn().mockResolvedValue("csv");
    const stores = emptyStores();
    const { deps } = makeDeps(
      [makePolicy(), bodyCompositionPolicy],
      readCsv,
      stores
    );
    await syncTanitaImport(deps, input);

    // Act
    const result = await syncTanitaImport(deps, input);

    // Assert
    expect(result).toEqual({ ok: true, imported: 0, skipped: BOTH_EXTENSIONS });
    expect(stores.weight.size).toBe(1);
    expect(stores["body-composition"].size).toBe(1);
  });

  it("should stamp tanita-bridge provenance on every imported record", async () => {
    // Arrange
    const readCsv = vi.fn().mockResolvedValue("csv");
    const { deps, stores } = makeDeps(
      [makePolicy(), bodyCompositionPolicy],
      readCsv
    );

    // Act
    await syncTanitaImport(deps, input);

    // Assert
    const rows = [
      ...stores.weight.values(),
      ...stores["body-composition"].values(),
    ];
    expect(rows).toHaveLength(BOTH_EXTENSIONS);
    expect(rows.every((r) => r.sourceBridgeId === "tanita-bridge")).toBe(true);
  });

  it("should report a transport error without persisting anything", async () => {
    // Arrange
    const readCsv = vi.fn().mockRejectedValue(new Error("Session expired"));
    const { deps, stores } = makeDeps(
      [makePolicy(), bodyCompositionPolicy],
      readCsv
    );

    // Act
    const result = await syncTanitaImport(deps, input);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Session expired",
    });
    expect(stores.weight.size).toBe(0);
  });
});
