import { useEffect, useState } from "react";

export const LOCK_POLL_MS = 1_000;

const isHeld = async (locks: LockManager, name: string) => {
  try {
    const { held = [] } = await locks.query();
    return held.some((lock) => lock.name === name);
  } catch {
    return false;
  }
};

/**
 * Whether any tab holds the Web Lock `name`, polled for as long as it is
 * watched: a run that takes the lock again after a release (another tab,
 * or the chat tool in this one) shows within one poll. `watchKey` restarts
 * the watch (a new attempt under the same lock). No `name`, no Web Locks,
 * or a failed query answers `false`; each new watch answers `true` until
 * its first answer, so a live run never flashes as settled.
 */
export const useRecordLockHeld = (
  name: string | undefined,
  watchKey?: string
): boolean => {
  const [held, setHeld] = useState(true);
  useEffect(() => {
    const locks = globalThis.navigator?.locks;
    if (!name || !locks) {
      setHeld(false);
      return;
    }
    setHeld(true);
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const now = await isHeld(locks, name);
      if (stopped) return;
      setHeld(now);
      timer = setTimeout(() => void check(), LOCK_POLL_MS);
    };
    void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [name, watchKey]);
  return held;
};
