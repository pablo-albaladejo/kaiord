/**
 * "Automatic" in the matrix stores a row an older build reads with the same
 * result. The older resolver below is copied verbatim in behaviour from
 * 7e104f062 (`resolve-effective-source.use-case.ts` and
 * `effective-source-order.ts`): a row that is not `union` is a ranking read
 * through `sourceOrder ∩ enabled imports`, `manual` exempt.
 */
import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { automaticChoiceRow } from "./automatic-choice-row";
import {
  resolveEffectiveSource,
  type SourcedRecord,
} from "./resolve-effective-source.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const DAY = "2026-11-23";

type Rec = SourcedRecord<{ kg?: number; hours?: number }>;

const olderBuildResolve = (
  row: DataTypeSourcePolicy | undefined,
  imports: readonly IntegrationPolicy[],
  records: readonly Rec[]
):
  | { mode: "union"; records: readonly Rec[] }
  | { mode: "priority"; effective?: Rec } => {
  const mode = row?.mode ?? "union";
  if (mode === "union") return { mode: "union", records };
  const enabled = new Set(
    imports.filter((p) => p.enabled).map((p) => p.bridgeId)
  );
  const order = (row?.sourceOrder ?? []).filter(
    (id) => id === "manual" || enabled.has(id)
  );
  for (const id of order) {
    const match = records.find((r) => r.sourceBridgeId === id);
    if (match) return { mode: "priority", effective: match };
  }
  return { mode: "priority", effective: undefined };
};

const importOf = (
  dataType: ManagedDataType,
  bridgeId: string
): IntegrationPolicy => ({
  id: `${dataType}-${bridgeId}`,
  profileId: PROFILE_ID,
  dataType,
  bridgeId,
  direction: "import",
  mode: "auto",
  enabled: true,
  updatedAt: "2026-11-01T00:00:00.000Z",
});

const newerBuildResolve = (
  row: DataTypeSourcePolicy,
  imports: readonly IntegrationPolicy[],
  records: readonly Rec[]
) =>
  resolveEffectiveSource<Rec["record"]>(
    {
      sourcePolicyRepo: { findByProfileAndType: async () => row },
      capabilityDecisions: { listByProfile: async () => [] },
      policyRepo: { findByProfileDirection: async () => [...imports] },
      getRecordsForDay: async () => [...records],
    },
    { profileId: PROFILE_ID, dataType: row.dataType, day: DAY }
  );

describe("automaticChoiceRow", () => {
  it("should show an older build the same weight Authority the newer build applies", async () => {
    // Arrange
    const row = automaticChoiceRow(PROFILE_ID, "weight");
    const imports = [
      importOf("weight", "train2go-bridge"),
      importOf("weight", "tanita-bridge"),
    ];
    const records: Rec[] = [
      { sourceBridgeId: "train2go-bridge", record: { kg: 71 } },
      { sourceBridgeId: "tanita-bridge", record: { kg: 70.4 } },
    ];

    // Act
    const older = olderBuildResolve(row, imports, records);
    const newer = await newerBuildResolve(row, imports, records);

    // Assert
    expect(older).toEqual({ mode: "priority", effective: records[1] });
    expect(newer).toMatchObject({ mode: "automatic", effective: records[1] });
  });

  it("should show an older build the athlete's own entry first, as the rule does", async () => {
    // Arrange
    const row = automaticChoiceRow(PROFILE_ID, "sleep");
    const imports = [importOf("sleep", "whoop-bridge")];
    const records: Rec[] = [
      { sourceBridgeId: "whoop-bridge", record: { hours: 7 } },
      { sourceBridgeId: "manual", record: { hours: 6.5 } },
    ];

    // Act
    const older = olderBuildResolve(row, imports, records);
    const newer = await newerBuildResolve(row, imports, records);

    // Assert
    expect(older).toEqual({ mode: "priority", effective: records[1] });
    expect(newer).toMatchObject({ mode: "automatic", effective: records[1] });
  });

  it("should keep every source for an older build on a kind the rule keeps side by side", async () => {
    // Arrange
    const row = automaticChoiceRow(PROFILE_ID, "activity");
    const records: Rec[] = [
      { sourceBridgeId: "garmin-bridge", record: {} },
      { sourceBridgeId: "whoop-bridge", record: {} },
    ];

    // Act
    const older = olderBuildResolve(row, [], records);
    const newer = await newerBuildResolve(row, [], records);

    // Assert
    expect(older).toEqual({ mode: "union", records });
    expect(newer).toEqual({ mode: "union", records });
  });

  it("should never store a ranking an older build reads as empty", () => {
    // Arrange
    const kinds: ManagedDataType[] = [
      "weight",
      "body-composition",
      "sleep",
      "hrv",
      "training-zones",
    ];

    // Act
    const rows = kinds.map((kind) => automaticChoiceRow(PROFILE_ID, kind));

    // Assert
    for (const row of rows) {
      expect(row.mode).toBe("priority");
      expect(row.sourceOrder.length).toBeGreaterThan(0);
      expect(row.automatic).toBe(true);
    }
  });
});
