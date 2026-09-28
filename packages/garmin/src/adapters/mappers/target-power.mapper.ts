import { createMissingFtpError } from "@kaiord/core";

type Val = { unit: string; value?: number; min?: number; max?: number };

const isUsableFtp = (ftpWatts: number | undefined): ftpWatts is number =>
  ftpWatts !== undefined && Number.isFinite(ftpWatts) && ftpWatts > 0;

/**
 * Garmin Connect `power.zone` targets hold absolute watts, so a `percent_ftp`
 * target is resolved against the athlete's FTP. Without a usable FTP the
 * conversion fails instead of writing the percentage as watts.
 */
export const resolvePercentFtpToWatts = (
  value: Val,
  ftpWatts: number | undefined
): Val => {
  if (value.unit !== "percent_ftp") return value;
  if (!isUsableFtp(ftpWatts)) throw createMissingFtpError("garmin");
  if (value.value === undefined) return { unit: "watts" };
  return { unit: "watts", value: Math.round((value.value / 100) * ftpWatts) };
};
