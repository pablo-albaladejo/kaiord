export type SchemaProbeResult =
  | { status: "absent" }
  | { status: "stale"; nativeVersion: number }
  | { status: "fresh"; nativeVersion: number; release: () => void }
  | { status: "unknown" };

const ABSENT: SchemaProbeResult = { status: "absent" };
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
 * reports "unknown", so boot falls back to the normal open.
 */
export function probeSchema(
  name: string,
  declaredVerno: number,
  factory: IDBFactory | null = globalThis.indexedDB ?? null
): Promise<SchemaProbeResult> {
  return new Promise((resolve) => {
    let absent = false;
    let request: IDBOpenDBRequest;
    try {
      if (!factory) return resolve(UNKNOWN);
      request = factory.open(name);
    } catch {
      return resolve(UNKNOWN);
    }
    request.onupgradeneeded = (event) => {
      absent = event.oldVersion === 0;
      request.transaction?.abort();
    };
    request.onerror = (event) => {
      event.preventDefault();
      resolve(absent ? ABSENT : UNKNOWN);
    };
    request.onsuccess = () =>
      resolve(settleOpened(request.result, declaredVerno));
  });
}
