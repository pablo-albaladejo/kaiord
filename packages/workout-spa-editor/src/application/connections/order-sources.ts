/**
 * Merge a saved source ranking with the sources that are live right now:
 * saved order first (dropping bridges that are no longer enabled), then any
 * newly-enabled source appended, so the list never hides an active source.
 *
 * The Data Hub's priority editor was this function's first caller; it is now
 * called by the Connections page's source-of-truth control.
 */
export const orderSources = (
  available: readonly string[],
  saved: readonly string[]
): string[] => {
  const present = new Set(available);
  const kept = saved.filter((bridgeId) => present.has(bridgeId));
  const appended = available.filter((bridgeId) => !kept.includes(bridgeId));
  return [...kept, ...appended];
};
