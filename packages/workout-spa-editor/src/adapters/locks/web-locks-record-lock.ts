/**
 * RecordLockPort over the Web Locks API: `ifAvailable` answers `null` at
 * once when another tab holds the lock, and the lock is released when the
 * callback's promise settles — resolved or rejected. `undefined` when the
 * context has no `navigator.locks` (plain HTTP), which the pipeline reads as
 * "library only".
 */
import type {
  LockOutcome,
  RecordLockPort,
} from "../../application/garmin-placement/record-lock-port";

export const createWebLocksRecordLock = (
  locks: LockManager | undefined = globalThis.navigator?.locks
): RecordLockPort | undefined =>
  locks && {
    tryRun: <T>(name: string, run: () => Promise<T>) =>
      locks.request(
        name,
        { ifAvailable: true },
        async (lock): Promise<LockOutcome<T>> =>
          lock ? { acquired: true, value: await run() } : { acquired: false }
      ),
  };
