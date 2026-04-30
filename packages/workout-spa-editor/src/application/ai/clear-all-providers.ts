/**
 * clearAllProviders — deletes every provider in sequence.
 *
 * The Privacy tab calls this when the user erases stored AI
 * credentials. Sequential deletes; no `persistence.transaction`
 * wrapper because the repository's WebCrypto pass voids any
 * IDB-level Dexie transaction. A mid-batch failure leaves the
 * remaining providers intact; the caller surfaces an error toast
 * and the user can retry.
 */

import type { PersistencePort } from "../../ports/persistence-port";

export const clearAllProviders = async (
  persistence: PersistencePort
): Promise<void> => {
  const all = await persistence.aiProviders.getAll();
  for (const p of all) {
    await persistence.aiProviders.delete(p.id);
  }
};
