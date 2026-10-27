import type Dexie from "dexie";

import { isNewerSchema } from "./schema-probe";

/** The installed database belongs to newer code than this tab runs. */
export class StaleSchemaError extends Error {
  readonly nativeVersion: number;
  constructor(nativeVersion: number) {
    super(`The database is at native version ${nativeVersion}, newer code.`);
    this.name = "StaleSchemaError";
    this.nativeVersion = nativeVersion;
  }
}

type StaleListener = (nativeVersion: number) => void;
const listeners = new Set<StaleListener>();
// Sticky: a host that subscribes after the event still sees it.
let staleVersion: number | null = null;

/** The newer native version this tab met, or null while it is current. */
export const getStaleSchemaVersion = (): number | null => staleVersion;

/** Subscribes to "this tab is now stale"; returns the unsubscribe. */
export const onStaleSchema = (listener: StaleListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyStale = (nativeVersion: number): void => {
  staleVersion = nativeVersion;
  for (const listener of listeners) listener(nativeVersion);
};

type GuardedDb = Pick<Dexie, "on" | "verno" | "backendDB" | "close">;

/**
 * Must run in the constructor, right after the versions are registered:
 * `verno` is still the declared version, and Dexie fires ready subscribers in
 * registration order, so a throw here stops every later one (junk cleanup,
 * default-profile boot) and rejects `open()` and every queued query.
 */
export function installStaleSchemaGuard(db: GuardedDb): void {
  const declared = db.verno;
  db.on(
    "ready",
    () => {
      const nativeVersion = db.backendDB().version;
      if (!isNewerSchema(nativeVersion, declared)) return;
      notifyStale(nativeVersion);
      throw new StaleSchemaError(nativeVersion);
    },
    true
  );
  // A later `versionchange` subscriber runs before Dexie's default, and
  // returning `false` keeps the default from re-enabling auto-open.
  db.on("versionchange", (event: IDBVersionChangeEvent) => {
    const next = event.newVersion;
    if (next === null || !isNewerSchema(next, declared)) return undefined;
    db.close({ disableAutoOpen: true });
    notifyStale(next);
    return false;
  });
}
