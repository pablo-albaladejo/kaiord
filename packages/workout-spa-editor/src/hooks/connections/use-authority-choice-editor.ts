/**
 * The two `dataTypeSourcePolicy` writes the Authority matrix performs,
 * through the same port the `set_authority` Tool writes — no new write path.
 *
 * `pick` stores `priority`, led by the picked source. `automatic` hands the
 * kind back to the App's rule with `automaticChoiceRow`: a row rather than a
 * deletion, so the hand-back syncs to the athlete's other devices like any
 * other choice, and shaped so an older build reads the same Authority.
 */
import type { ManagedDataType } from "@kaiord/core";
import { useCallback } from "react";

import {
  type AuthorityOptions,
  promoteSource,
} from "../../application/connections/authority-options";
import { automaticChoiceRow } from "../../application/data-source-policy/automatic-choice-row";
import { usePersistence } from "../../contexts/persistence-context";

export type AuthorityChoiceEditor = {
  pick: (
    dataType: ManagedDataType,
    options: AuthorityOptions,
    sourceId: string
  ) => Promise<void>;
  automatic: (dataType: ManagedDataType) => Promise<void>;
};

export const useAuthorityChoiceEditor = (
  profileId: string
): AuthorityChoiceEditor => {
  const persistence = usePersistence();

  const pick = useCallback(
    async (
      dataType: ManagedDataType,
      options: AuthorityOptions,
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
      await persistence.dataTypeSourcePolicy.put(
        automaticChoiceRow(profileId, dataType)
      );
    },
    [persistence, profileId]
  );

  return { pick, automatic };
};
