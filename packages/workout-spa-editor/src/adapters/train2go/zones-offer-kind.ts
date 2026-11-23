import { tableKeyOfField } from "../../application/coaching/sync-zones-snapshot";
import type { ConflictItem } from "../../types/coaching-zones";

/** What an offer holds, so its words name exactly that. */
export type ZonesOfferKind = "zones" | "thresholds" | "both";

export const zonesOfferKind = (
  conflicts: readonly ConflictItem[]
): ZonesOfferKind => {
  const zones = conflicts.some((c) => tableKeyOfField(c.field) !== null);
  const thresholds = conflicts.some((c) => tableKeyOfField(c.field) === null);
  if (zones && thresholds) return "both";
  return zones ? "zones" : "thresholds";
};
