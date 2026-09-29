/**
 * A stand-in for Dexie's serialized transactions in writer-race tests: one
 * writer at a time, and `contended` resolves when a second one waits.
 */
export const createTransactionLock = () => {
  let tail: Promise<void> = Promise.resolve();
  let held = false;
  let signal = () => undefined as void;
  const contended = new Promise<void>((resolve) => (signal = resolve));
  const transaction = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (held) signal();
    const previous = tail;
    let release = () => undefined as void;
    tail = new Promise((resolve) => (release = resolve));
    await previous;
    held = true;
    try {
      return await fn();
    } finally {
      held = false;
      release();
    }
  };
  return { transaction, contended };
};
