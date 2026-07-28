/**
 * Dependency surface for `deleteIntegrationPolicy`. Wider than the shared
 * `IntegrationPolicyDeps` because the delete has to record its own tombstone
 * atomically with the row removal; the read-only and upsert use cases keep the
 * narrow surface.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import type { IntegrationPolicyDeps } from "./integration-policy-deps";

export type DeleteIntegrationPolicyDeps = IntegrationPolicyDeps &
  Pick<PersistencePort, "tombstones" | "transaction">;
