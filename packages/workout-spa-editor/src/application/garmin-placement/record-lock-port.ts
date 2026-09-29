/**
 * Port — a cross-tab lock per record (Web Locks, `ifAvailable`). `tryRun`
 * runs `run` only when the lock is free and releases it when `run` settles,
 * resolved or rejected; a lock held elsewhere answers `acquired: false`
 * without running anything.
 */
export type LockOutcome<T> = { acquired: true; value: T } | { acquired: false };

export type RecordLockPort = {
  tryRun: <T>(name: string, run: () => Promise<T>) => Promise<LockOutcome<T>>;
};
