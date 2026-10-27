export type SchemaProbeResult =
  | { status: "absent" }
  | { status: "stale"; nativeVersion: number }
  | { status: "fresh"; nativeVersion: number; release: () => void }
  | { status: "unknown" };

const ABSENT: SchemaProbeResult = { status: "absent" };
// Boot waits on the probe before the first render, so it must not wait long.
export const PROBE_DEADLINE_MS = 1500;
const UNKNOWN: SchemaProbeResult = { status: "unknown" };

/**
 * Dexie stores `verno * 10` as the native version, and its schema patching
 * can bump that by one within a major (370 → 371) with no newer deploy. Only
 * a higher major belongs to newer code.
 */
export const isNewerSchema = (
  nativeVersion: number,
  declaredVerno: number
): boolean => Math.floor(nativeVersion / 10) > declaredVerno;

const settleOpened = (
  connection: IDBDatabase,
  declaredVerno: number
): SchemaProbeResult => {
  // Never hold up another tab's upgrade.
  connection.onversionchange = () => connection.close();
  const nativeVersion = connection.version;
  if (isNewerSchema(nativeVersion, declaredVerno)) {
    connection.close();
    return { status: "stale", nativeVersion };
  }
  return { status: "fresh", nativeVersion, release: () => connection.close() };
};

/**
 * Reads the installed version without upgrading it. Opening with no version
 * never upgrades an existing database. For an absent one it would create v1,
 * so the probe aborts that upgrade, which leaves no database behind. It never
 * calls `deleteDatabase`: the app's own open may be queued behind the probe,
 * and a delete would destroy the database that open creates. Any failure
 * reports "unknown", so boot falls back to the normal open, and so does a
 * probe that has not settled by the deadline; a connection that opens after
 * it is closed at once.
 */
export function probeSchema(
  name: string,
  declaredVerno: number,
  factory: IDBFactory | null = globalThis.indexedDB ?? null,
  deadlineMs = PROBE_DEADLINE_MS
): Promise<SchemaProbeResult> {
  return new Promise((resolve) => {
    let absent = false;
    let late = false;
    let request: IDBOpenDBRequest;
    try {
      if (!factory) return resolve(UNKNOWN);
      request = factory.open(name);
    } catch {
      return resolve(UNKNOWN);
    }
    const timer = setTimeout(() => {
      late = true;
      resolve(UNKNOWN);
    }, deadlineMs);
    const settle = (result: SchemaProbeResult) => {
      clearTimeout(timer);
      resolve(result);
    };
    request.onupgradeneeded = (event) => {
      absent = event.oldVersion === 0;
      request.transaction?.abort();
    };
    request.onerror = (event) => {
      event.preventDefault();
      settle(absent ? ABSENT : UNKNOWN);
    };
    request.onsuccess = () => {
      if (late) return request.result.close();
      settle(settleOpened(request.result, declaredVerno));
    };
  });
}
