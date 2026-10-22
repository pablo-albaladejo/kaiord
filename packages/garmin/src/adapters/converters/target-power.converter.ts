import { createMissingFtpError } from "@kaiord/core";

type Val = {
  unit: string;
  value?: number;
  min?: number;
  max?: number;
  basis?: string;
};

const PERCENT = 100;

const isUsableFtp = (ftpWatts: number | undefined): ftpWatts is number =>
  ftpWatts !== undefined && Number.isFinite(ftpWatts) && ftpWatts > 0;

const isPercentFtp = (value: Val): boolean =>
  value.unit === "percent_ftp" ||
  (value.unit === "range" && value.basis === "percent_ftp");

const toWatts = (pct: number | undefined, ftpWatts: number) =>
  pct === undefined ? undefined : Math.round((pct * ftpWatts) / PERCENT);

/**
 * Garmin Connect `power.zone` targets hold absolute watts, so a `percent_ftp`
 * target — single or a range with `basis: "percent_ftp"` — is resolved against
 * the athlete's FTP. Without a usable FTP the conversion fails instead of
 * writing the percentage as watts.
 */
export const resolvePercentFtpToWatts = (
  value: Val,
  ftpWatts: number | undefined
): Val => {
  if (!isPercentFtp(value)) return value;
  if (!isUsableFtp(ftpWatts)) throw createMissingFtpError("garmin");
  if (value.unit === "range") {
    const min = toWatts(value.min, ftpWatts);
    const max = toWatts(value.max, ftpWatts);
    return { unit: "range", min, max };
  }
  if (value.value === undefined) return { unit: "watts" };
  return { unit: "watts", value: toWatts(value.value, ftpWatts) };
};
