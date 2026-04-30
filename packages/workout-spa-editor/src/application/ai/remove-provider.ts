/**
 * removeProvider — deletes a provider, promoting the next remaining
 * provider to default if the deleted one held that flag.
 *
 * Invariant I2: there is always exactly one default while any
 * provider exists. The Dexie adapter cannot atomically wrap the
 * delete + promote because the repository's WebCrypto pass voids the
 * IDB transaction; we sequence the writes in code and accept the
 * single-tab single-user window where a concurrent writer could
 * observe an intermediate "no default" state.
 */

import type { PersistencePort } from "../../ports/persistence-port";

export const removeProvider = async (
  persistence: PersistencePort,
  providerId: string
): Promise<void> => {
  const all = await persistence.aiProviders.getAll();
  const target = all.find((p) => p.id === providerId);
  if (!target) return;

  await persistence.aiProviders.delete(providerId);

  if (target.isDefault) {
    const promoted = all.find((p) => p.id !== providerId);
    if (promoted) {
      await persistence.aiProviders.put({ ...promoted, isDefault: true });
    }
  }
};
