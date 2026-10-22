const DATE_SUFFIX = /^\d{8}$/;

/**
 * `served` is `requested` plus a `-YYYYMMDD` suffix. A plain prefix
 * comparison: an id never becomes part of a regular expression.
 */
export const isDatedSnapshotOf = (served: string, requested: string) =>
  served.startsWith(`${requested}-`) &&
  DATE_SUFFIX.test(served.slice(requested.length + 1));
