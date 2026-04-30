/**
 * setDefaultProvider — flips the default flag to a single provider.
 *
 * Sequential writes; no `persistence.transaction` wrapper because the
 * repository's WebCrypto pass voids any IDB-level Dexie transaction.
 * In single-tab single-user the brief window where two providers
 * carry the default flag is acceptable.
 */

import type { PersistencePort } from "../../ports/persistence-port";
import { ProviderNotFoundError } from "./errors";

export const setDefaultProvider = async (
  persistence: PersistencePort,
  providerId: string
): Promise<void> => {
  const all = await persistence.aiProviders.getAll();
  if (!all.some((p) => p.id === providerId)) {
    throw new ProviderNotFoundError(providerId);
  }

  for (const p of all) {
    const isDefault = p.id === providerId;
    if (p.isDefault !== isDefault) {
      await persistence.aiProviders.put({ ...p, isDefault });
    }
  }
};
