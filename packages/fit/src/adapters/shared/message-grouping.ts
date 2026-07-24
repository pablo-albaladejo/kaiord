/**
 * Groups a flat list of FIT messages into the SDK-style keyed shape the
 * FIT encoder consumes. Messages whose `mesgNum` is missing, non-numeric,
 * or absent from `mesgNumToKey` are dropped.
 */
export const groupMessagesByNumber = (
  rawMessages: unknown[],
  mesgNumToKey: Record<number, string>
): Record<string, unknown[]> => {
  const result: Record<string, unknown[]> = {};
  for (const message of rawMessages) {
    const { mesgNum } = message as { mesgNum?: number };
    if (typeof mesgNum !== "number") continue;
    const key = mesgNumToKey[mesgNum];
    if (key) {
      result[key] = [...(result[key] || []), message];
    }
  }
  return result;
};
