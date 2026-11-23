/**
 * The decision every safe write to a Platform shares: read the live state
 * first; only a confirmed absence counts as absent, and a read that fails
 * or cannot tell proves nothing. With `settle`, an absence is confirmed by
 * a second read `settle.ms` later that agrees (the Platform may show a new
 * write late); without it, the Platform's own "not found" is the
 * confirmation. The record is then written under a guarded update by the
 * caller, which re-checks the row it read.
 */
export type LiveState = "present" | "absent" | "unknown";

export type Settle = { ms: number; sleep: (ms: number) => Promise<void> };

export const readLiveState = async <R extends { state: LiveState }>(
  read: () => Promise<R>,
  settle?: Settle
): Promise<R> => {
  const first = await read();
  if (first.state !== "absent" || !settle) return first;
  await settle.sleep(settle.ms);
  return read();
};
