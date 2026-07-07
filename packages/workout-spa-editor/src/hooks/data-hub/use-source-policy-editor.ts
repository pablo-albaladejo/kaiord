/**
 * useSourcePolicyEditor — write handlers for the Data Hub multi-source editor
 * (F4.1). Persists DataTypeSourcePolicy rows via its Dexie repository:
 * switching to `union` clears the order; `priority` and every reorder write
 * the effective bridge order. This surface owns only the per-type mode/order;
 * the resolver (F3.2) still filters that order by enabled import routes.
 */
import { useCallback } from "react";

import { createDexieDataTypeSourcePolicyRepository } from "../../adapters/dexie/dexie-data-type-source-policy-repository";
import { db } from "../../adapters/dexie/dexie-database";
import {
  reorderSources,
  type SourcePolicyRow,
} from "../../application/data-hub/source-policy-rows";
import type { DataTypeSourceMode } from "../../types/data-type-source-policy";

const repo = createDexieDataTypeSourcePolicyRepository(db);

export type SourcePolicyEditor = {
  setMode: (row: SourcePolicyRow, mode: DataTypeSourceMode) => Promise<void>;
  move: (
    row: SourcePolicyRow,
    bridgeId: string,
    delta: number
  ) => Promise<void>;
};

export const useSourcePolicyEditor = (
  profileId: string | null
): SourcePolicyEditor => {
  const setMode = useCallback(
    async (row: SourcePolicyRow, mode: DataTypeSourceMode) => {
      if (!profileId) return;
      await repo.put({
        profileId,
        dataType: row.dataType,
        mode,
        sourceOrder: mode === "priority" ? row.sourceOrder : [],
      });
    },
    [profileId]
  );

  const move = useCallback(
    async (row: SourcePolicyRow, bridgeId: string, delta: number) => {
      if (!profileId) return;
      await repo.put({
        profileId,
        dataType: row.dataType,
        mode: "priority",
        sourceOrder: reorderSources(row.sourceOrder, bridgeId, delta),
      });
    },
    [profileId]
  );

  return { setMode, move };
};
