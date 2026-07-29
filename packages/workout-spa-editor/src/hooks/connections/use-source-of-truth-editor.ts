/**
 * The two writes the row's "Change" control performs, through the same
 * `dataTypeSourcePolicy` port the chat tool and the Data Hub editor use — no
 * new write path.
 *
 * `pick` stores `priority`, which genuinely changes how the type is READ: the
 * resolver stops returning every source's record and starts consulting the
 * order. That consequence is stated in the panel before either button is
 * reachable. `keepAll` is the way back, and clears the order the way
 * `useSourcePolicyEditor` already does, so a stale ranking cannot resurface.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import {
  promoteSource,
  type SourceOfTruthOptions,
} from "../../application/connections/source-of-truth-options";
import { usePersistence } from "../../contexts/persistence-context";

export type SourceOfTruthEditor = {
  pick: (
    dataType: ManagedDataType,
    options: SourceOfTruthOptions,
    sourceId: string
  ) => Promise<void>;
  keepAll: (dataType: ManagedDataType) => Promise<void>;
};

export const useSourceOfTruthEditor = (
  profileId: string
): SourceOfTruthEditor => {
  const persistence = usePersistence();

  const pick = useCallback(
    async (
      dataType: ManagedDataType,
      options: SourceOfTruthOptions,
      sourceId: string
    ) => {
      await persistence.dataTypeSourcePolicy.put({
        profileId,
        dataType,
        mode: "priority",
        sourceOrder: promoteSource(options, sourceId),
      });
    },
    [persistence, profileId]
  );

  const keepAll = useCallback(
    async (dataType: ManagedDataType) => {
      await persistence.dataTypeSourcePolicy.put({
        profileId,
        dataType,
        mode: "union",
        sourceOrder: [],
      });
    },
    [persistence, profileId]
  );

  return { pick, keepAll };
};
