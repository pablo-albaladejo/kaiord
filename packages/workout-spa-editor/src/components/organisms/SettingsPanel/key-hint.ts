/**
 * The last four characters of a key, or nothing when the key is that short:
 * four characters of a four-character key would be the key itself.
 */
export const keyLastFour = (apiKey: string): string =>
  apiKey.length > 4 ? apiKey.slice(-4) : "";

/** The key behind a mask, with its last four characters at most. */
export const keyHint = (apiKey: string): string => `••••${keyLastFour(apiKey)}`;
