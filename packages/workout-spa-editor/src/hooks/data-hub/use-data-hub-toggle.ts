/**
 * useDataHubToggle — flip an IntegrationPolicy route on/off from a Data Hub
 * cell (F4.1). Only bridge cells in the `active`/`available` states are
 * toggleable; the matrix passes those through here.
 *
 * The existing route's `mode` (manual/auto) is preserved on toggle — a fresh
 * route defaults to `auto` (the sensible "just turn it on" choice); the finer
 * per-source semantics live in the dedicated editor, not this on/off switch.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import { db } from "../../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../../adapters/dexie/dexie-integration-policy-repository";
import type { DataHubCell } from "../../application/data-hub/build-data-hub-matrix";
import { upsertIntegrationPolicy } from "../../application/integration-policy/upsert-integration-policy.use-case";

const policyRepo = createDexieIntegrationPolicyRepository(db);

export type DataHubToggle = (
  dataType: ManagedDataType,
  bridgeId: string,
  cell: DataHubCell
) => Promise<void>;

export const useDataHubToggle = (profileId: string | null): DataHubToggle =>
  useCallback(
    async (dataType, bridgeId, cell) => {
      if (!profileId) return;
      const existing = await policyRepo.findByNaturalKey({
        profileId,
        dataType,
        direction: cell.direction,
        bridgeId,
      });
      await upsertIntegrationPolicy(
        { policyRepo },
        {
          profileId,
          dataType,
          bridgeId,
          direction: cell.direction,
          mode: existing?.mode ?? "auto",
          enabled: !cell.enabled,
        }
      );
    },
    [profileId]
  );
