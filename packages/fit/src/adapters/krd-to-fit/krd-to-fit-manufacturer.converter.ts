import { Profile } from "@garmin/fitsdk";
import type { Logger } from "@kaiord/core";

const DEFAULT_MANUFACTURER = "garmin";

/**
 * Maps KRD manufacturer string to valid FIT Profile manufacturer enum value.
 * Uses fuzzy matching (case-insensitive, prefix matching).
 */
export const mapManufacturer = (
  manufacturer: string | undefined,
  logger: Logger
): string => {
  if (!manufacturer) {
    return DEFAULT_MANUFACTURER;
  }

  const manufacturerEnum = Profile.types.manufacturer;
  const manufacturerValues = Object.values(manufacturerEnum);
  const normalized = manufacturer.toLowerCase();

  const matched = manufacturerValues.find(
    (value) =>
      value.toLowerCase() === normalized ||
      value.toLowerCase().startsWith(normalized) ||
      normalized.startsWith(value.toLowerCase())
  );

  if (matched) return matched;

  logger.warn(
    `Unknown manufacturer "${manufacturer}", using fallback "${DEFAULT_MANUFACTURER}"`,
    { original: manufacturer, fallback: DEFAULT_MANUFACTURER }
  );
  return DEFAULT_MANUFACTURER;
};
