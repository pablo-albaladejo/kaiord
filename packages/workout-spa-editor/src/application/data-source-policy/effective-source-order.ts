/**
 * The source order a "priority" read actually consults:
 * `sourceOrder ∩ enabled import policies`. "manual" has no bridge or
 * policy row and is always active, so it is never filtered out.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { IntegrationPolicy } from "../../types/integration-policy";
import { MANUAL_SOURCE_BRIDGE_ID } from "../import/stamp-provenance";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { automaticOrder, hasAutomaticAuthority } from "./automatic-authority";
import {
  type AuthorityChoiceDeps,
  readAuthorityChoice,
} from "./read-authority-choice";

export const effectiveSourceOrder = (
  sourceOrder: readonly string[],
  importPolicies: readonly IntegrationPolicy[]
): string[] => {
  const enabled = new Set(
    importPolicies.filter((p) => p.enabled).map((p) => p.bridgeId)
  );
  return sourceOrder.filter(
    (bridgeId) => bridgeId === MANUAL_SOURCE_BRIDGE_ID || enabled.has(bridgeId)
  );
};

export type SourceOrderDeps = AuthorityChoiceDeps & {
  policyRepo: Pick<IntegrationPolicyRepository, "findByProfileDirection">;
};

const NONE_DISABLED: ReadonlySet<string> = new Set();

/** The order a ranked read consults and the bridges whose rows it drops:
    the athlete's choice when one is in force, else the automatic Authority
    (which drops nothing); `undefined` when every source is kept. */
export const loadPriorityReadPolicy = async (
  deps: SourceOrderDeps,
  input: { profileId: string; dataType: ManagedDataType }
): Promise<{ order: string[]; disabled: ReadonlySet<string> } | undefined> => {
  const choice = await readAuthorityChoice(deps, input);
  if (choice?.mode === "union") return undefined;
  if (choice === undefined && !hasAutomaticAuthority(input.dataType)) {
    return undefined;
  }
  const importPolicies = await deps.policyRepo.findByProfileDirection({
    ...input,
    direction: "import",
  });
  if (choice === undefined) {
    return {
      order: automaticOrder(input.dataType, importPolicies),
      disabled: NONE_DISABLED,
    };
  }
  return {
    order: effectiveSourceOrder(choice.sourceOrder, importPolicies),
    disabled: new Set(
      importPolicies.filter((p) => !p.enabled).map((p) => p.bridgeId)
    ),
  };
};
