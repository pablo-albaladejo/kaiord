/**
 * The one function that decides what decides a kind today, used by every
 * reader (the Day's resolver, the daily-wellness reading, the assistant's
 * answer): the athlete's choice in force, else the automatic Authority,
 * else every source kept side by side.
 */
import type { ManagedDataType } from "@kaiord/core";

import type {
  DataTypeSourcePolicy,
  StoredSourceMode,
} from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import {
  automaticOrder,
  disabledImports,
  hasAutomaticAuthority,
} from "./automatic-authority";
import { effectiveSourceOrder } from "./effective-source-order";
import {
  type AuthorityChoiceDeps,
  readAuthorityChoice,
} from "./read-authority-choice";

export type AuthorityInForce = {
  mode: StoredSourceMode;
  /** The order a ranked read consults; empty when every source is kept. */
  sourceOrder: string[];
  /** Bridges whose rows a ranked read drops (only under the athlete's choice). */
  disabled: ReadonlySet<string>;
};

const NONE: ReadonlySet<string> = new Set();

export const authorityInForce = (
  dataType: ManagedDataType,
  choice: DataTypeSourcePolicy | undefined,
  importPolicies: readonly IntegrationPolicy[]
): AuthorityInForce => {
  if (choice === undefined || choice.mode === "automatic") {
    return hasAutomaticAuthority(dataType)
      ? {
          mode: "automatic",
          sourceOrder: automaticOrder(dataType, importPolicies),
          disabled: NONE,
        }
      : { mode: "union", sourceOrder: [], disabled: NONE };
  }
  if (choice.mode === "union") {
    return { mode: "union", sourceOrder: [], disabled: NONE };
  }
  return {
    mode: "priority",
    sourceOrder: effectiveSourceOrder(choice.sourceOrder, importPolicies),
    disabled: disabledImports(importPolicies),
  };
};

export type AuthorityInForceDeps = AuthorityChoiceDeps & {
  policyRepo: Pick<IntegrationPolicyRepository, "findByProfileDirection">;
};

export const loadAuthorityInForce = async (
  deps: AuthorityInForceDeps,
  input: { profileId: string; dataType: ManagedDataType }
): Promise<AuthorityInForce> => {
  const [choice, importPolicies] = await Promise.all([
    readAuthorityChoice(deps, input),
    deps.policyRepo.findByProfileDirection({ ...input, direction: "import" }),
  ]);
  return authorityInForce(input.dataType, choice, importPolicies);
};

/** The order a ranked read consults and the bridges whose rows it drops;
    `undefined` when every source is kept. */
export const loadPriorityReadPolicy = async (
  deps: AuthorityInForceDeps,
  input: { profileId: string; dataType: ManagedDataType }
): Promise<{ order: string[]; disabled: ReadonlySet<string> } | undefined> => {
  const authority = await loadAuthorityInForce(deps, input);
  return authority.mode === "union"
    ? undefined
    : { order: authority.sourceOrder, disabled: authority.disabled };
};
