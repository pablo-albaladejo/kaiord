import type { Translate } from "../i18n/use-translate";

/**
 * Title-case a snake_case sport / subSport token so KRD values such as
 * `flexibility_training` render as "Flexibility Training" in the UI.
 */
export const humanizeSport = (value: string): string =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/** The localized name of a sport or sub-sport, title-cased when unlisted. */
export const sportLabel = (
  value: string,
  t: Translate,
  group: "sport" | "subSport" = "sport"
): string => {
  const key = `metadata.${group}.${value}`;
  const label = t(key);
  return label === key ? humanizeSport(value) : label;
};
