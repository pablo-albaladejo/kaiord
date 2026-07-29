/**
 * useDataTypeRouting — the Connections page's per-data-type routing rows.
 *
 * `byDataType` is passed in rather than read again: the page already holds one
 * `useDataFlows` subscription, and a second would re-run its 26 queries for
 * the same answer.
 *
 * Freshness bypasses the Data Hub matrix entirely. The rows are per-TYPE and
 * each already resolves at most one source, so the per-source read is the one
 * that fits — and nothing here is stranded when Wave 4 deletes the matrix UI.
 */
import { useMemo } from "react";

import {
  buildDataTypeRoutingRows,
  type DataTypeRoutingRow,
} from "../../application/connections/data-type-routing";
import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { usePersistence } from "../../contexts/persistence-context";
import { useBridgeSyncStates } from "../data-hub/use-bridge-sync-states";
import { useDataTypeSourcePolicies } from "../data-hub/use-data-type-source-policies";

export type DataTypeRouting = {
  readonly rows: readonly DataTypeRoutingRow[];
  /**
   * Integration id → last sync. `coachingSyncState` is keyed by
   * (source, profile) and never by data type, so this is when that SOURCE last
   * sent Kaiord anything — not when this type last arrived. Every row fed by
   * the same source shows the same instant; the copy has to say so.
   */
  readonly lastSyncedAt: ReadonlyMap<string, string | undefined>;
};

export const useDataTypeRouting = (
  profileId: string | null,
  byDataType: DataFlowsByType
): DataTypeRouting => {
  const persistence = usePersistence();
  const lastSyncedAt = useBridgeSyncStates(persistence, profileId);
  const policies = useDataTypeSourcePolicies(profileId);

  const rows = useMemo(
    () => buildDataTypeRoutingRows(byDataType, policies),
    [byDataType, policies]
  );

  return { rows, lastSyncedAt };
};
