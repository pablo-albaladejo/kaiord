/**
 * deleteIntegrationPolicy — deletes an IntegrationPolicy row by id.
 * No-op when the row is already absent.
 */
import type { IntegrationPolicyDeps } from "./integration-policy-deps";

export type DeleteIntegrationPolicyInput = {
  id: string;
};

export const deleteIntegrationPolicy = async (
  deps: IntegrationPolicyDeps,
  input: DeleteIntegrationPolicyInput
): Promise<void> => {
  await deps.policyRepo.deleteById(input.id);
};
