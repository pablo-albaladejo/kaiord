import type { ConflictItem } from "../../types/coaching-zones";
import { readOffers, subscribeOffers, writeOffers } from "./zones-offer-store";

const NONE: readonly ConflictItem[] = [];

const sameSet = (a: readonly ConflictItem[], b: readonly ConflictItem[]) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * Remembers on this device the zones and thresholds Train2Go reported
 * differently, open until the athlete takes them or keeps theirs. True for a
 * new set (it is offered); the same set is never offered twice. A sync with
 * nothing different forgets the offer.
 */
export const rememberZonesOffer = (
  profileId: string,
  conflicts: readonly ConflictItem[]
): boolean => {
  const store = readOffers();
  const held = store[profileId];
  if (conflicts.length === 0) {
    if (held) {
      writeOffers(
        Object.fromEntries(
          Object.entries(store).filter(([id]) => id !== profileId)
        )
      );
    }
    return false;
  }
  if (held && sameSet(held.conflicts, conflicts)) return false;
  writeOffers({
    ...store,
    [profileId]: { conflicts: [...conflicts], open: true },
  });
  return true;
};

/** The offer still open for an athlete, empty once settled. */
export const openZonesOffer = (profileId: string): readonly ConflictItem[] => {
  const held = readOffers()[profileId];
  return held?.open ? held.conflicts : NONE;
};

/** The athlete took Train2Go's numbers or kept theirs: the offer closes. */
export const settleZonesOffer = (profileId: string): void => {
  const store = readOffers();
  const held = store[profileId];
  if (!held?.open) return;
  writeOffers({ ...store, [profileId]: { ...held, open: false } });
};

export const subscribeZonesOffers = subscribeOffers;
