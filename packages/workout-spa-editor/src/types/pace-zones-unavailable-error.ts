/**
 * A workout whose pace zone targets the profile cannot resolve to ranges.
 * `reason` is an app-authored literal, one of the placement failure
 * reasons, so the UI, analytics and the chat tool can each name the fix.
 */
/** Why pace zone targets cannot be resolved: no zones and no threshold
    pace, a referenced zone left undefined, or a sport without pace. */
const PACE_ZONES_UNAVAILABLE_REASONS = [
  "missing-pace-zones",
  "incomplete-pace-zones",
  "unsupported-pace-zone-sport",
] as const;
export type PaceZonesUnavailableReason =
  (typeof PACE_ZONES_UNAVAILABLE_REASONS)[number];

export const isPaceZonesReason = (
  reason: string
): reason is PaceZonesUnavailableReason =>
  (PACE_ZONES_UNAVAILABLE_REASONS as readonly string[]).includes(reason);

export class PaceZonesUnavailableError extends Error {
  readonly reason: PaceZonesUnavailableReason;
  constructor(reason: PaceZonesUnavailableReason) {
    super(`This workout's pace zones cannot be resolved: ${reason}.`);
    this.name = "PaceZonesUnavailableError";
    this.reason = reason;
  }
}
