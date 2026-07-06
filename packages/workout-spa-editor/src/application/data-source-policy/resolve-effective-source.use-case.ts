/**
 * resolveEffectiveSource — the multi-source read resolver (F3.2).
 *
 * Given (profileId, dataType, day), returns the effective record(s):
 *   - "union" (default, no companion row): every source's record for
 *     that day, each tagged with its real sourceBridgeId.
 *   - "priority": the record from the first source in `sourceOrder`
 *     that has data that day — falls back to the next source
 *     automatically when the preferred one has none; no source with
 *     data ⇒ an explicit empty result (never a silent guess).
 *
 * Reconciliation invariant (Architect): the order actually consulted is
 * `sourceOrder ∩ enabled import policies` — a source in the order
 * without an active import policy is skipped. "manual" is exempt from
 * this filter (it has no bridge/policy row; it's always active by
 * product decision, same as everywhere else in the hub).
 *
 * `getRecordsForDay` is injected so this stays a pure, adapter-free
 * function — the hooks layer wires it to the actual per-metric Dexie
 * table query (health records live in type-specific tables).
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import type { DataTypeSourcePolicyRepository } from "./data-type-source-policy-repository.port";

const MANUAL_SOURCE_BRIDGE_ID = "manual";

export type SourcedRecord<T> = {
  sourceBridgeId: string;
  record: T;
};

export type ResolveEffectiveSourceDeps<T> = {
  sourcePolicyRepo: DataTypeSourcePolicyRepository;
  policyRepo: IntegrationPolicyRepository;
  getRecordsForDay: (input: {
    profileId: string;
    dataType: ManagedDataType;
    day: string;
  }) => Promise<SourcedRecord<T>[]>;
};

export type ResolveEffectiveSourceInput = {
  profileId: string;
  dataType: ManagedDataType;
  day: string;
};

export type ResolveEffectiveSourceResult<T> =
  | { mode: "union"; records: SourcedRecord<T>[] }
  | { mode: "priority"; effective: SourcedRecord<T>; usedFallback: boolean }
  | { mode: "priority"; effective: undefined; usedFallback: false };

const resolvePriority = <T>(
  order: readonly string[],
  recordsForDay: readonly SourcedRecord<T>[]
): ResolveEffectiveSourceResult<T> => {
  for (let i = 0; i < order.length; i++) {
    const match = recordsForDay.find((r) => r.sourceBridgeId === order[i]);
    if (match) return { mode: "priority", effective: match, usedFallback: i > 0 };
  }
  return { mode: "priority", effective: undefined, usedFallback: false };
};

export const resolveEffectiveSource = async <T>(
  deps: ResolveEffectiveSourceDeps<T>,
  input: ResolveEffectiveSourceInput
): Promise<ResolveEffectiveSourceResult<T>> => {
  const { profileId, dataType, day } = input;
  const recordsForDay = await deps.getRecordsForDay({ profileId, dataType, day });
  const sourcePolicy = await deps.sourcePolicyRepo.findByProfileAndType({
    profileId,
    dataType,
  });
  const mode = sourcePolicy?.mode ?? "union";

  if (mode === "union") {
    return { mode: "union", records: recordsForDay };
  }

  const importPolicies = await deps.policyRepo.findByProfileDirection({
    profileId,
    dataType,
    direction: "import",
  });
  const enabledBridgeIds = new Set(
    importPolicies.filter((p) => p.enabled).map((p) => p.bridgeId)
  );
  const effectiveOrder = (sourcePolicy?.sourceOrder ?? []).filter(
    (bridgeId) =>
      bridgeId === MANUAL_SOURCE_BRIDGE_ID || enabledBridgeIds.has(bridgeId)
  );

  return resolvePriority(effectiveOrder, recordsForDay);
};
