/**
 * A workout whose %FTP power targets cannot be written as watts. `reason`
 * is an app-authored literal, one of the placement failure reasons, so the
 * UI, analytics and the chat tool can each name the fix.
 */
/** Why %FTP targets cannot be resolved: the profile holds no FTP for the
    workout's sport, or the sport has no power zones at all. */
const FTP_UNAVAILABLE_REASONS = [
  "missing-ftp",
  "sport-without-power-zones",
] as const;
export type FtpUnavailableReason = (typeof FTP_UNAVAILABLE_REASONS)[number];

export const isFtpReason = (reason: string): reason is FtpUnavailableReason =>
  (FTP_UNAVAILABLE_REASONS as readonly string[]).includes(reason);

export class FtpUnavailableError extends Error {
  readonly reason: FtpUnavailableReason;
  constructor(reason: FtpUnavailableReason) {
    super(`This workout's %FTP power targets need an FTP: ${reason}.`);
    this.name = "FtpUnavailableError";
    this.reason = reason;
  }
}
