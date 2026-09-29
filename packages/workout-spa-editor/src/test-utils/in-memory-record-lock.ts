/**
 * An in-memory lock manager shared by several "tabs": each `port()` is one
 * tab's RecordLockPort over the same held-name set, with the Web Locks
 * `ifAvailable` semantics (held elsewhere → not acquired, nothing runs; the
 * lock is released when `run` settles, on success, failure or throw).
 */
import type {
  LockOutcome,
  RecordLockPort,
} from "../application/garmin-placement/record-lock-port";

export const createInMemoryLockManager = () => {
  const held = new Set<string>();
  const port = (): RecordLockPort => ({
    tryRun: async <T>(
      name: string,
      run: () => Promise<T>
    ): Promise<LockOutcome<T>> => {
      if (held.has(name)) return { acquired: false };
      held.add(name);
      try {
        return { acquired: true, value: await run() };
      } finally {
        held.delete(name);
      }
    },
  });
  return { held, port };
};
