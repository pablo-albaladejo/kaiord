/**
 * removeProvider — deletes a provider, promoting the next remaining
 * provider to default if the deleted one held that flag, and deletes every
 * athlete's model bindings that pointed at it (providers are shared by all
 * athletes; bindings are per athlete), so no orphan binding is left behind.
 *
 * Invariant I2: there is always exactly one default while any
 * provider exists. The delete, the binding cleanup and the promotion run in
 * ONE `persistence.transaction`, so a failure rolls the whole removal back
 * (the provider repository keeps its WebCrypto pass alive inside a Dexie
 * transaction with `Dexie.waitFor`).
 */

import type { PersistencePort } from "../../ports/persistence-port";

const deleteBindingsOf = async (
  persistence: PersistencePort,
  providerId: string
): Promise<void> => {
  for (const profile of await persistence.profiles.getAll()) {
    const bindings = await persistence.aiModelBindings.getAll(profile.id);
    for (const b of bindings.filter((x) => x.providerId === providerId)) {
      await persistence.aiModelBindings.delete(profile.id, b.purpose);
    }
  }
};

export const removeProvider = async (
  persistence: PersistencePort,
  providerId: string
): Promise<void> => {
  const all = await persistence.aiProviders.getAll();
  const target = all.find((p) => p.id === providerId);
  if (!target) return;

  await persistence.transaction(async () => {
    await persistence.aiProviders.delete(providerId);
    await deleteBindingsOf(persistence, providerId);
    const promoted = target.isDefault
      ? all.find((p) => p.id !== providerId)
      : undefined;
    if (promoted) {
      await persistence.aiProviders.put({ ...promoted, isDefault: true });
    }
  });
};
