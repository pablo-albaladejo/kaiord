import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { AUTOMATIC_AUTHORITY, OWN_ENTRY_SOURCES } from "./automatic-authority";

/**
 * The row "Automatic" stores: marked `automatic` for this build, and shaped
 * as the rule itself for an older one, which reads any row that is not
 * `union` as a ranking: the athlete's own entry, then the kind's Platforms
 * in the rule's order. An older build drops what its ranking does not list
 * or whose import is off, as it always did; the Platform that decides is
 * the same.
 */
export const automaticChoiceRow = (
  profileId: string,
  dataType: ManagedDataType
): DataTypeSourcePolicy => {
  const platforms = AUTOMATIC_AUTHORITY[dataType];
  return platforms === undefined
    ? { profileId, dataType, mode: "union", sourceOrder: [], automatic: true }
    : {
        profileId,
        dataType,
        mode: "priority",
        sourceOrder: [...OWN_ENTRY_SOURCES, ...platforms],
        automatic: true,
      };
};
