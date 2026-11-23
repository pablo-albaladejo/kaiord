import type { ZonesOfferKind } from "./zones-offer-kind";

/** The `coaching` dictionary keys that name exactly what an offer holds. */
export const KEPT_COPY = {
  thresholds: "zonesSync.kept.thresholds",
  zones: "zonesSync.kept.zones",
  both: "zonesSync.kept.both",
} as const satisfies Record<ZonesOfferKind, string>;

export const TAKEN_COPY = {
  thresholds: "zonesSync.taken.thresholds",
  zones: "zonesSync.taken.zones",
  both: "zonesSync.taken.both",
} as const satisfies Record<ZonesOfferKind, string>;
