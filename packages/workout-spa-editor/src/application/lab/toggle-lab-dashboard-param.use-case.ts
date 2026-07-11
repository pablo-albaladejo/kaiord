/**
 * toggleLabDashboardParam — pin/unpin a parameter on the F5 dashboard
 * against the CURRENT persisted selection. The toggle must not be
 * computed from a rendered live-query snapshot: a second pin arriving
 * before the re-emission would overwrite the first (lost update).
 */

import {
  setUserPreferenceFields,
  type SetUserPreferenceFieldsDeps,
} from "../set-user-preference-fields";
import { toggleDashboardParam } from "./toggle-dashboard-param";

export type ToggleLabDashboardParamInput = {
  profileId: string;
  parameterKey: string;
};

export async function toggleLabDashboardParam(
  input: ToggleLabDashboardParamInput,
  deps: SetUserPreferenceFieldsDeps
): Promise<void> {
  const existing = await deps.repository.get(input.profileId);
  const labDashboardParams = toggleDashboardParam(
    existing?.labDashboardParams,
    input.parameterKey
  );
  await setUserPreferenceFields(
    { profileId: input.profileId, patch: { labDashboardParams } },
    deps
  );
}
