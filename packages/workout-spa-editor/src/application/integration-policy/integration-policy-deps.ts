/**
 * Shared dependency type for integration-policy use cases.
 * Use cases depend only on the repository port — no Dexie imports here.
 */
import type { IntegrationPolicyRepository } from "./integration-policy-repository.port";

export type IntegrationPolicyDeps = {
  policyRepo: IntegrationPolicyRepository;
};
