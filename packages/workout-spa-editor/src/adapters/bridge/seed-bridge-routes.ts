/**
 * After an explicit link, open the routes the linked bridge feeds (see
 * `seedImportRoutesOnLink`). The link itself already succeeded, so a failure
 * here must not reject the caller: it leaves the routes as they were, which
 * the calendar and Connections already report, and it is logged rather than
 * swallowed. The reads and writes run as one transaction, so a partial seed is
 * never left behind.
 */
import { seedImportRoutesOnLink } from "../../application/integration-policy/seed-import-routes-on-link.use-case";
import type { PersistencePort } from "../../ports/persistence-port";
import { logger } from "../../utils/logger";
import { bridgeDiscovery } from "./bridge-discovery";

const SEED_FAILED = "Could not open the routes of a newly linked source";

export const seedBridgeRoutes = async (
  p: PersistencePort,
  profileId: string,
  bridgeId: string
): Promise<void> => {
  try {
    await p.transaction(() =>
      seedImportRoutesOnLink(
        { policyRepo: p.integrationPolicy },
        {
          profileId,
          bridgeId,
          capabilities: bridgeDiscovery.getCapabilities(bridgeId) ?? [],
        }
      )
    );
  } catch {
    logger.error(SEED_FAILED);
  }
};
