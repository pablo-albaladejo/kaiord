/**
 * Tests for resolveEffectiveSource — the F3.2 multi-source read
 * resolver. Pure use-case with in-memory port mocks; no Dexie/React.
 */
import { describe, expect, it, vi } from "vitest";

import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { resolveEffectiveSource } from "./resolve-effective-source.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const DAY = "2026-05-26";

const importPolicy = (
  bridgeId: string,
  enabled: boolean
): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "sleep",
  bridgeId,
  direction: "import",
  mode: "auto",
  enabled,
  updatedAt: "2026-05-01T00:00:00.000Z",
});

const sourcePolicy = (
  mode: DataTypeSourcePolicy["mode"],
  sourceOrder: string[]
): DataTypeSourcePolicy => ({
  profileId: PROFILE_ID,
  dataType: "sleep",
  mode,
  sourceOrder,
});

const makeDeps = (
  sourcePol: DataTypeSourcePolicy | undefined,
  importPols: IntegrationPolicy[],
  records: Array<{ sourceBridgeId: string; record: unknown }>
) => ({
  sourcePolicyRepo: {
    findByProfileAndType: vi.fn(async () => sourcePol),
    put: vi.fn(),
  },
  policyRepo: {
    findByProfileDirection: vi.fn(async () => importPols),
  } as unknown as {
    findByProfileDirection: (input: unknown) => Promise<IntegrationPolicy[]>;
  },
  getRecordsForDay: vi.fn(async () => records),
});

describe("resolveEffectiveSource — union mode", () => {
  it("should default to union with all sources when no companion row exists", async () => {
    // Arrange
    const records = [
      { sourceBridgeId: "whoop-bridge", record: { score: 80 } },
      { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
    ];
    const deps = makeDeps(undefined, [], records);

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result).toEqual({ mode: "union", records });
  });

  it("should pass through manual, fit-import, and unknown as valid sources unchanged", async () => {
    // Arrange
    const records = [
      { sourceBridgeId: "manual", record: { score: 70 } },
      { sourceBridgeId: "fit-import", record: { score: 72 } },
      { sourceBridgeId: "unknown", record: { score: 74 } },
    ];
    const deps = makeDeps(sourcePolicy("union", []), [], records);

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result).toEqual({ mode: "union", records });
  });
});

describe("resolveEffectiveSource — priority mode", () => {
  it("should pick the first-ranked source when both sources have a record for the day (tie)", async () => {
    // Arrange
    const records = [
      { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
      { sourceBridgeId: "whoop-bridge", record: { score: 80 } },
    ];
    const deps = makeDeps(
      sourcePolicy("priority", ["whoop-bridge", "garmin-bridge"]),
      [importPolicy("whoop-bridge", true), importPolicy("garmin-bridge", true)],
      records
    );

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result).toEqual({
      mode: "priority",
      effective: { sourceBridgeId: "whoop-bridge", record: { score: 80 } },
      usedFallback: false,
    });
  });

  it("should fall back to the next source in order when the preferred one has no record that day", async () => {
    // Arrange
    const records = [
      { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
    ];
    const deps = makeDeps(
      sourcePolicy("priority", ["whoop-bridge", "garmin-bridge"]),
      [importPolicy("whoop-bridge", true), importPolicy("garmin-bridge", true)],
      records
    );

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result).toEqual({
      mode: "priority",
      effective: { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
      usedFallback: true,
    });
  });

  it("should return an explicit empty result when no ranked source has a record", async () => {
    // Arrange
    const deps = makeDeps(
      sourcePolicy("priority", ["whoop-bridge", "garmin-bridge"]),
      [importPolicy("whoop-bridge", true), importPolicy("garmin-bridge", true)],
      []
    );

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result).toEqual({
      mode: "priority",
      effective: undefined,
      usedFallback: false,
    });
  });

  it("should skip a ranked source whose import policy is disabled (reconciliation invariant)", async () => {
    // Arrange
    // whoop-bridge is ranked first but its import policy is disabled —
    // the effective order excludes it even though it has a record.
    const records = [
      { sourceBridgeId: "whoop-bridge", record: { score: 80 } },
      { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
    ];
    const deps = makeDeps(
      sourcePolicy("priority", ["whoop-bridge", "garmin-bridge"]),
      [
        importPolicy("whoop-bridge", false),
        importPolicy("garmin-bridge", true),
      ],
      records
    );

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    // garmin-bridge is the only EFFECTIVE candidate once whoop-bridge is
    // reconciled out — picking it isn't a data-availability fallback.
    expect(result).toEqual({
      mode: "priority",
      effective: { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
      usedFallback: false,
    });
  });

  it("should skip a ranked source with no import policy row at all (reconciliation invariant)", async () => {
    // Arrange
    const records = [
      { sourceBridgeId: "whoop-bridge", record: { score: 80 } },
      { sourceBridgeId: "garmin-bridge", record: { score: 75 } },
    ];
    const deps = makeDeps(
      sourcePolicy("priority", ["whoop-bridge", "garmin-bridge"]),
      [importPolicy("garmin-bridge", true)],
      records
    );

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result.mode).toBe("priority");
    expect(
      result.mode === "priority" ? result.effective?.sourceBridgeId : undefined
    ).toBe("garmin-bridge");
  });

  it("should never filter out 'manual' from the order even without an import policy row", async () => {
    // Arrange
    // "manual" has no bridgeId/policy row by design — it must still win
    // when ranked first, exempt from the reconciliation filter.
    const records = [{ sourceBridgeId: "manual", record: { score: 70 } }];
    const deps = makeDeps(
      sourcePolicy("priority", ["manual", "garmin-bridge"]),
      [importPolicy("garmin-bridge", true)],
      records
    );

    // Act
    const result = await resolveEffectiveSource(deps, {
      profileId: PROFILE_ID,
      dataType: "sleep",
      day: DAY,
    });

    // Assert
    expect(result).toEqual({
      mode: "priority",
      effective: { sourceBridgeId: "manual", record: { score: 70 } },
      usedFallback: false,
    });
  });
});
