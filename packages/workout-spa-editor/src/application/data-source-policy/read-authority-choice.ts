/**
 * The athlete's own choice of Authority for a kind, when one applies: a row
 * stored by the matrix (or by the assistant's `set_authority`), honoured
 * only while the matrix Capability is on, read through the Capabilities'
 * read API (`resolveCapabilities`). A row means the athlete used the matrix,
 * so with no decision recorded it reads as on, as the catalogue's
 * `adoptsExistingData` says. A row marked "automatic" hands the kind back to
 * the App's rule. Turned off, the row is kept and the automatic rule
 * decides; turned on again, the row applies again.
 */
import type { ManagedDataType } from "@kaiord/core";

import {
  decisionsFrom,
  resolveCapabilities,
} from "../../lib/capabilities/resolve-capabilities";
import type { CapabilityDecisionRepository } from "../../ports/capability-decision-repository";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { AUTHORITY_MATRIX_ID } from "./automatic-authority";
import type { DataTypeSourcePolicyRepository } from "./data-type-source-policy-repository.port";

export type AuthorityChoiceDeps = {
  sourcePolicyRepo: Pick<
    DataTypeSourcePolicyRepository,
    "findByProfileAndType"
  >;
  capabilityDecisions: Pick<CapabilityDecisionRepository, "listByProfile">;
};

/** A stored row as the choice in force, or `undefined` for the rule. */
export const choiceInForce = (
  stored: DataTypeSourcePolicy | undefined,
  matrixOn: boolean
): DataTypeSourcePolicy | undefined =>
  stored === undefined ||
  !matrixOn ||
  stored.automatic === true ||
  stored.mode === "automatic"
    ? undefined
    : stored;

/** Every stored row as the choices in force: none while the matrix is off. */
export const choicesInForce = (
  stored: readonly DataTypeSourcePolicy[],
  matrixOn: boolean
): readonly DataTypeSourcePolicy[] =>
  stored.flatMap((row) => choiceInForce(row, matrixOn) ?? []);

export const readAuthorityChoice = async (
  deps: AuthorityChoiceDeps,
  input: { profileId: string; dataType: ManagedDataType }
): Promise<DataTypeSourcePolicy | undefined> => {
  const stored = await deps.sourcePolicyRepo.findByProfileAndType(input);
  if (stored === undefined) return undefined;
  const rows = await deps.capabilityDecisions.listByProfile(input.profileId);
  const matrix = resolveCapabilities({
    decisions: decisionsFrom(rows),
    // The stored row is the matrix's adopted data for this athlete.
    withData: new Set([AUTHORITY_MATRIX_ID]),
  });
  return choiceInForce(stored, matrix.isOn(AUTHORITY_MATRIX_ID));
};
