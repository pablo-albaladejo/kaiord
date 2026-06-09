/**
 * Title-case a snake_case sport / subSport token so KRD values such as
 * `flexibility_training` render as "Flexibility Training" in the UI.
 */
export const humanizeSport = (value: string): string =>
  value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
