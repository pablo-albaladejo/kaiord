/**
 * The athlete's own choice of Authority for a kind, when one applies: a row
 * stored by the matrix (or by the assistant's `set_data_route`), honoured
 * only while the matrix Capability is not turned off. A row the matrix wrote
 * as "automatic" hands the type back to the App's rule. A row means the
 * athlete used the matrix, so with no decision recorded it reads as on, as
 * the catalogue's `adoptsExistingData` says. Turned off, the row is kept and
 * the automatic rule decides; turned on again, the row applies again.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { UserPreferencesRepository } from "../../ports/user-preferences-repository";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { AUTHORITY_MATRIX_ID } from "./automatic-authority";
import type { DataTypeSourcePolicyRepository } from "./data-type-source-policy-repository.port";

export type AuthorityChoiceDeps = {
  sourcePolicyRepo: Pick<
    DataTypeSourcePolicyRepository,
    "findByProfileAndType"
  >;
  userPreferences: Pick<UserPreferencesRepository, "get">;
};

export const readAuthorityChoice = async (
  deps: AuthorityChoiceDeps,
  input: { profileId: string; dataType: ManagedDataType }
): Promise<DataTypeSourcePolicy | undefined> => {
  const stored = await deps.sourcePolicyRepo.findByProfileAndType(input);
  if (stored === undefined || stored.mode === "automatic") return undefined;
  const prefs = await deps.userPreferences.get(input.profileId);
  return prefs?.capabilities?.[AUTHORITY_MATRIX_ID] === false
    ? undefined
    : stored;
};
