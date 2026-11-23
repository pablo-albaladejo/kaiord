import type { ConflictItem } from "../../types/coaching-zones";

const KEY = "kaiord.zones-offered";

const signature = (profileId: string, conflicts: readonly ConflictItem[]) =>
  JSON.stringify([profileId, conflicts]);

/**
 * Whether these different numbers were already offered on this device, and
 * records them if not: the offer is made once, not on every sync. Storage
 * that throws (a private window) only means the offer may repeat.
 */
export const firstOffer = (
  profileId: string,
  conflicts: readonly ConflictItem[]
): boolean => {
  const next = signature(profileId, conflicts);
  try {
    if (localStorage.getItem(KEY) === next) return false;
    localStorage.setItem(KEY, next);
  } catch {
    return true;
  }
  return true;
};
