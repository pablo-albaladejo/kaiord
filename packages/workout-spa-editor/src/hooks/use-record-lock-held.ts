import { useEffect, useState } from "react";

const POLL_MS = 1_000;

/**
 * Whether any tab holds the Web Lock `name`, polled until it is released.
 * `watchKey` restarts the watch (a new attempt under the same lock). No
 * `name`, or no Web Locks, answers `false`; until the first answer, `true`,
 * so a live run never flashes as settled.
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
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      const { held: list = [] } = await locks.query();
      if (stopped) return;
      const now = list.some((lock) => lock.name === name);
      setHeld(now);
      if (now) timer = setTimeout(() => void check(), POLL_MS);
    };
    void check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [name, watchKey]);
  return held;
};
