import { MissingFtpError } from "@kaiord/core";

import { missingFtpPlacement } from "../../../hooks/garmin-placement-export";
import { profileRepo } from "../../../hooks/garmin-push-fn";
import type { Translate } from "../../../i18n/use-translate";
import { ftpForWorkout, missingFtpReason } from "../../../lib/athlete";
import type { KRD } from "../../../types/krd";
import { exportGcnWorkout } from "../../../utils/export-workout-formats";

/** What a failed send says: the missing-FTP cause, localized, when the
    %FTP workout had no FTP; the error's own text otherwise. */
export const pushErrorMessage = (
  error: unknown,
  krd: KRD,
  t: Translate
): string => {
  if (error instanceof MissingFtpError) {
    return missingFtpReason(krd) === "no-ftp"
      ? t("footer.missingFtp")
      : t("footer.missingFtpSport");
  }
  return error instanceof Error ? error.message : "Conversion failed";
};

/** The GCN with the owner's FTP, so %FTP targets reach Garmin as watts. */
export const exportWithOwnerFtp = async (profileId: string, krd: KRD) =>
  exportGcnWorkout(
    krd,
    ftpForWorkout(await profileRepo.getById(profileId), krd)
  );

/** The feedback shows the result, so a missing FTP must be its cause. */
export const earlyFailure = (error: unknown, krd: KRD) =>
  error instanceof MissingFtpError ? missingFtpPlacement(krd) : undefined;
