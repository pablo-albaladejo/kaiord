/** The last four characters of a key behind a mask; never the key itself. */
export const keyHint = (apiKey: string): string => `••••${apiKey.slice(-4)}`;
