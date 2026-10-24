/**
 * A Garmin export the athlete's profile cannot resolve: pace zones, an FTP
 * for %FTP power, or a max HR for %max HR heart rate. Each carries a
 * placement failure `reason` that names the fix, so callers report it as a
 * non-retryable result instead of a generic push failure.
 */
import { FtpUnavailableError } from "./ftp-unavailable-error";
import { MaxHrUnavailableError } from "./max-hr-unavailable-error";
import { PaceZonesUnavailableError } from "./pace-zones-unavailable-error";

export type ProfileRefusal =
  PaceZonesUnavailableError | FtpUnavailableError | MaxHrUnavailableError;

export const isProfileRefusal = (error: unknown): error is ProfileRefusal =>
  error instanceof PaceZonesUnavailableError ||
  error instanceof FtpUnavailableError ||
  error instanceof MaxHrUnavailableError;
