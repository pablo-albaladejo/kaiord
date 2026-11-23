/**
 * Runs a Trace's writes one after another, so a checkpoint never lands after
 * the finished record, and reports a failed write instead of throwing it.
 */
export const serialWrites = (onError?: (error: unknown) => void) => {
  let queue: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T | null> => {
    const next = queue.then(task, task);
    queue = next.catch(() => undefined);
    return next.catch((error: unknown) => {
      onError?.(error);
      return null;
    });
  };
};
