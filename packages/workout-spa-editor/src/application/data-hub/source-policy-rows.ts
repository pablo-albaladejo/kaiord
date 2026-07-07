/**
 * Pure assembly for the Data Hub multi-source editor (F4.1).
 *
 * A data type qualifies for a source-priority control only when the profile
 * has 2+ ENABLED import bridge routes for it — that is the honest "you have
 * multiple sources" signal (the same IntegrationPolicy state the matrix
 * toggles drive). `sourceOrder` merges the saved priority with the live
 * enabled sources: saved order first (dropping stale bridges), then any
 * newly-enabled source appended, so the list never hides an active source.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import type {
  DataTypeSourceMode,
  DataTypeSourcePolicy,
} from "../../types/data-type-source-policy";
import { DEFAULT_DATA_TYPE_SOURCE_MODE } from "../../types/data-type-source-policy";

export type SourcePolicyRow = {
  dataType: ManagedDataType;
  label: string;
  mode: DataTypeSourceMode;
  /** Enabled import bridge sources, in effective priority order (2+). */
  sourceOrder: string[];
};

export const orderSources = (
  available: readonly string[],
  saved: readonly string[]
): string[] => {
  const present = new Set(available);
  const kept = saved.filter((bridgeId) => present.has(bridgeId));
  const appended = available.filter((bridgeId) => !kept.includes(bridgeId));
  return [...kept, ...appended];
};

export const reorderSources = (
  order: readonly string[],
  bridgeId: string,
  delta: number
): string[] => {
  const from = order.indexOf(bridgeId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return [...order];
  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
};

export const buildSourcePolicyRows = (
  byDataType: DataFlowsByType,
  policies: readonly DataTypeSourcePolicy[]
): SourcePolicyRow[] => {
  const byType = new Map(policies.map((policy) => [policy.dataType, policy]));
  const rows: SourcePolicyRow[] = [];

  for (const dataType of managedDataTypes) {
    const enabledBridges = (byDataType.get(dataType)?.import ?? [])
      .filter((policy) => policy.enabled)
      .map((policy) => policy.bridgeId);
    const unique = [...new Set(enabledBridges)];
    if (unique.length < 2) continue;

    const policy = byType.get(dataType);
    rows.push({
      dataType,
      label: MANAGED_DATA_REGISTRY[dataType].label,
      mode: policy?.mode ?? DEFAULT_DATA_TYPE_SOURCE_MODE,
      sourceOrder: orderSources(unique, policy?.sourceOrder ?? []),
    });
  }

  return rows;
};
