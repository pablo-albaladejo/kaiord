/**
 * A workout whose %max HR heart-rate targets cannot be written as bpm.
 * `reason` is an app-authored literal, one of the placement failure reasons,
 * so the UI, analytics and the chat tool can each name the fix.
 */
/** Why %max HR targets cannot be resolved: the profile holds no max HR. */
const MAX_HR_UNAVAILABLE_REASONS = ["missing-max-hr"] as const;
export type MaxHrUnavailableReason =
  (typeof MAX_HR_UNAVAILABLE_REASONS)[number];

export const isMaxHrReason = (
  reason: string
): reason is MaxHrUnavailableReason =>
  (MAX_HR_UNAVAILABLE_REASONS as readonly string[]).includes(reason);

export class MaxHrUnavailableError extends Error {
  readonly reason: MaxHrUnavailableReason;
  constructor(reason: MaxHrUnavailableReason) {
    super(`This workout's %max HR targets need a max heart rate: ${reason}.`);
    this.name = "MaxHrUnavailableError";
    this.reason = reason;
  }
}
