// Debounced saves still waiting on their timer. A reload runs no React
// cleanup, so the update flow awaits these before the page goes away.

type Flush = () => Promise<unknown> | void;

const flushes = new Set<Flush>();

/** Registers a pending save; the returned function removes it. */
export function registerPendingFlush(flush: Flush): () => void {
  flushes.add(flush);
  return () => {
    flushes.delete(flush);
  };
}

/** Runs every pending save now and waits for all of them to settle. */
export async function flushPendingSaves(): Promise<void> {
  const running: (Promise<unknown> | void)[] = [];
  for (const flush of flushes) running.push(flush());
  await Promise.allSettled(running);
}
