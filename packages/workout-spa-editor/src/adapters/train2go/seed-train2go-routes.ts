/**
 * After an explicit Train2Go link, open the import routes the bridge feeds
 * (planned sessions, training zones) unless a policy already exists — a
 * freshly linked profile otherwise syncs nothing (`route-inactive`).
 * Best-effort: the link itself already succeeded, so a failure here only
 * leaves the route off, which the calendar already reports.
 */
import { seedImportRoutesOnLink } from "../../application/integration-policy/seed-import-routes-on-link.use-case";
import type { PersistencePort } from "../../ports/persistence-port";
import { bridgeDiscovery } from "../bridge/bridge-discovery";

const TRAIN2GO_BRIDGE = "train2go-bridge";

export const seedTrain2GoRoutes = async (
  p: PersistencePort,
  profileId: string
): Promise<void> => {
  try {
    await seedImportRoutesOnLink(
      { policyRepo: p.integrationPolicy },
      {
        profileId,
        bridgeId: TRAIN2GO_BRIDGE,
        capabilities: bridgeDiscovery.getCapabilities(TRAIN2GO_BRIDGE) ?? [],
      }
    );
  } catch {
    // Best-effort by design (see header).
  }
};
