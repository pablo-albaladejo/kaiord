import { t } from "../i18n/index.js";

/** Rejects an --ftp that cannot be an FTP (0, negative, NaN, "abc"), so
    it never reaches the writer as a bogus watts base. */
export const coerceFtp = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;
  const watts = Number(value);
  if (!Number.isFinite(watts) || watts <= 0)
    throw new Error(t("errors.ftpInvalid"));
  return watts;
};

/** The `--ftp` yargs option shared by `convert` and `garmin push`. */
export const ftpOption = (description: string) => ({
  type: "number" as const,
  description,
  coerce: coerceFtp,
});
