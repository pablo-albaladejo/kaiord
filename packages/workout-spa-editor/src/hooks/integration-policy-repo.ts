import { db } from "../adapters/dexie/dexie-database";
import { createDexieIntegrationPolicyRepository } from "../adapters/dexie/dexie-integration-policy-repository";

/** Single composition point for the integration-policy repository. Every
    consumer must import this instance rather than calling the factory again:
    the repository is the only writer of the `integrationPolicies` table, and
    parallel instances over the same Dexie handle make ownership of that table
    ambiguous. Keeping the `db` wiring here also keeps the adapter import out
    of the component layer (see the boundaries policies in eslint.config.js). */
export const policyRepo = createDexieIntegrationPolicyRepository(db);
