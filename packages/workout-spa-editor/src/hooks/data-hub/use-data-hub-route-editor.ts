/**
 * useDataHubRouteEditor — mode edit + remove for an existing Data Hub matrix
 * route (F4.2). Complements useDataHubToggle (create/enable/disable): once a
 * route exists, this covers changing its persisted mode — real behavior, not
 * cosmetic (zones-auto-import.ts gates on mode === "auto") — and removing it
 * outright, replacing ProfileManager's retired DataFlowsRow controls.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../adapters/dexie/dexie-integration-policy-repository";
import { deleteIntegrationPolicy } from "../../application/integration-policy/delete-integration-policy.use-case";
import { upsertIntegrationPolicy } from "../../application/integration-policy/upsert-integration-policy.use-case";
import type {
  IntegrationPolicyDirection,
  IntegrationPolicyMode,
} from "../../types/integration-policy";

const policyRepo = createDexieIntegrationPolicyRepository(db);

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
    [profileId]
  );

  const remove = useCallback(async (routeId: string) => {
    await deleteIntegrationPolicy({ policyRepo }, { id: routeId });
  }, []);

  return { setMode, remove };
};
