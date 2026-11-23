import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { AUTOMATIC_AUTHORITY, OWN_ENTRY_SOURCES } from "./automatic-authority";

export type AuthorityInForce = {
  mode: "union" | "priority" | "automatic";
  sourceOrder: string[];
};

/** What decides a kind today: the athlete's choice in force, else the
    automatic Authority, else every source kept side by side. */
export const authorityInForce = (
  dataType: ManagedDataType,
  choice: DataTypeSourcePolicy | undefined
): AuthorityInForce => {
  if (choice !== undefined) {
    return { mode: choice.mode, sourceOrder: choice.sourceOrder };
  }
  const automatic = AUTOMATIC_AUTHORITY[dataType];
  return automatic === undefined
    ? { mode: "union", sourceOrder: [] }
    : { mode: "automatic", sourceOrder: [...OWN_ENTRY_SOURCES, ...automatic] };
};
