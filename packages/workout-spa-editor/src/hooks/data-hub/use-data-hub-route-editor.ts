/**
 * useDataHubRouteEditor — mode edit + remove for an existing Data Hub matrix
 * route (F4.2). Complements useDataHubToggle (create/enable/disable): once a
 * route exists, this covers changing its persisted mode — real behavior, not
 * cosmetic (zones-auto-import.ts gates on mode === "auto") — and removing it
 * outright, replacing ProfileManager's retired DataFlowsRow controls.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import { deleteIntegrationPolicy } from "../../application/integration-policy/delete-integration-policy.use-case";
import { upsertIntegrationPolicy } from "../../application/integration-policy/upsert-integration-policy.use-case";
import { usePersistence } from "../../contexts/persistence-context";
import type {
  IntegrationPolicyDirection,
  IntegrationPolicyMode,
} from "../../types/integration-policy";

export type DataHubRouteEditor = {
  setMode: (
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection,
    bridgeId: string,
    mode: IntegrationPolicyMode
  ) => Promise<void>;
  remove: (routeId: string) => Promise<void>;
};

export const useDataHubRouteEditor = (
  profileId: string | null
): DataHubRouteEditor => {
  // Through the composed port, not a locally built repo: removing a route has
  // to write its tombstone against the same `tombstones` store and the same
  // transaction runner the rest of the app uses.
  const persistence = usePersistence();
  const policyRepo = persistence.integrationPolicy;

  const setMode = useCallback(
    async (
      dataType: ManagedDataType,
      direction: IntegrationPolicyDirection,
      bridgeId: string,
      mode: IntegrationPolicyMode
    ) => {
      if (!profileId) return;
      const existing = await policyRepo.findByNaturalKey({
        profileId,
        dataType,
        direction,
        bridgeId,
      });
      if (!existing) return;
      await upsertIntegrationPolicy({ policyRepo }, { ...existing, mode });
    },
    [profileId, policyRepo]
  );

  const remove = useCallback(
    async (routeId: string) => {
      await deleteIntegrationPolicy(
        {
          policyRepo,
          tombstones: persistence.tombstones,
          transaction: persistence.transaction,
        },
        { id: routeId }
      );
    },
    [persistence, policyRepo]
  );

  return { setMode, remove };
};
