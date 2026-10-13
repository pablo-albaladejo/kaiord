/**
 * Helpers over the frozen Dexie schema history (`kaiord-schema-history.json`).
 *
 * `KaiordDatabase` declares only the versions that carry an upgrade function,
 * plus the head. The JSON keeps every version ever shipped, so tests can build
 * a database exactly as any past release left it and compare the pruned
 * registration against the full history.
 */
import type Dexie from "dexie";

import { registerKaiordVersions } from "../adapters/dexie/register-kaiord-versions";
import history from "./kaiord-schema-history.json";

export type Stores = Record<string, string | null>;
type Upgrade = Parameters<ReturnType<Dexie["version"]>["upgrade"]>[0];
export type Registration = { stores: Stores; upgrade?: Upgrade };
type HistoryEntry = { version: number; upgrade: boolean; stores: Stores };

// TS infers the JSON's absent tables as `?: undefined`; at runtime they are absent.
export const SCHEMA_HISTORY =
  history.versions as unknown as readonly HistoryEntry[];
export const HISTORY_VERSIONS = SCHEMA_HISTORY.map((entry) => entry.version);
export const HISTORY_HEAD = Math.max(...HISTORY_VERSIONS);

/** Dexie merges `stores()` table by table, so the schema at `upTo` is a fold. */
export const cumulativeStores = (
  registrations: ReadonlyMap<number, { stores: Stores }>,
  upTo: number
): Stores =>
  [...registrations.entries()]
    .filter(([version]) => version <= upTo)
    .sort(([a], [b]) => a - b)
    .reduce<Stores>((acc, [, reg]) => ({ ...acc, ...reg.stores }), {});

export const historyRegistrations = (): Map<number, { stores: Stores }> =>
  new Map(SCHEMA_HISTORY.map((entry) => [entry.version, entry]));

/** What `registerKaiordVersions` declares today, version by version. */
export const captureKaiordRegistrations = (): Map<number, Registration> => {
  const captured = new Map<number, Registration>();
  const host = {
    version: (version: number) => {
      const reg = captured.get(version) ?? { stores: {} };
      captured.set(version, reg);
      const chain = {
        stores: (stores: Stores) => {
          reg.stores = { ...reg.stores, ...stores };
          return chain;
        },
        upgrade: (fn: Upgrade) => {
          reg.upgrade = fn;
          return chain;
        },
      };
      return chain;
    },
  };
  registerKaiordVersions(host as unknown as Pick<Dexie, "version">);
  return captured;
};

/**
 * Declares every historical version up to `upTo` on `db`, the way the app did
 * before pruning. With `upgrades`, each version gets its upgrade function.
 */
export const registerFullHistory = (
  db: Pick<Dexie, "version">,
  upTo: number = HISTORY_HEAD,
  upgrades?: ReadonlyMap<number, Registration>
): void => {
  for (const entry of SCHEMA_HISTORY) {
    if (entry.version > upTo) break;
    const version = db.version(entry.version).stores(entry.stores);
    const upgrade = upgrades?.get(entry.version)?.upgrade;
    if (upgrade) version.upgrade(upgrade);
  }
};
