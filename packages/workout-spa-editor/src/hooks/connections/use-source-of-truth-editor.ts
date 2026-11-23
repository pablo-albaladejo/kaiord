/**
 * The two `dataTypeSourcePolicy` writes the Authority matrix performs,
 * through the same port the `set_data_route` Tool writes — no new write path.
 *
 * `pick` stores `priority`, led by the picked source. `automatic` hands the
 * type back to the App's rule and clears the stored order as it goes, so a
 * stale ranking cannot resurface; it is a row rather than a deletion so the
 * hand-back syncs to the athlete's other devices like any other choice.
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
  automatic: (dataType: ManagedDataType) => Promise<void>;
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

  const automatic = useCallback(
    async (dataType: ManagedDataType) => {
      await persistence.dataTypeSourcePolicy.put({
        profileId,
        dataType,
        mode: "automatic",
        sourceOrder: [],
      });
    },
    [persistence, profileId]
  );

  return { pick, automatic };
};
