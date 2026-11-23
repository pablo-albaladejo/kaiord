import { z } from "zod";

import type { ConflictItem } from "../../types/coaching-zones";

const KEY = "kaiord.zones-offered";

const storeSchema = z.record(
  z.string(),
  z.object({
    conflicts: z.array(
      z.object({ field: z.string(), current: z.number(), incoming: z.number() })
    ),
    open: z.boolean(),
  })
);

/** Per athlete: the zones and thresholds offered, and whether still open. */
export type OfferStore = Record<
  string,
  { conflicts: ConflictItem[]; open: boolean }
>;

const listeners = new Set<() => void>();
// Storage that throws (a private window) keeps the offers for the session.
let memory: OfferStore = {};
// Same raw string, same object, as useSyncExternalStore requires.
let cachedRaw: string | null = null;
let cached: OfferStore = {};

const parse = (raw: string): OfferStore => {
  try {
    const result = storeSchema.safeParse(JSON.parse(raw));
    return result.success ? (result.data as OfferStore) : {};
  } catch {
    return {};
  }
};

export const readOffers = (): OfferStore => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = raw === null ? {} : parse(raw);
    }
    return cached;
  } catch {
    return memory;
  }
};

export const writeOffers = (store: OfferStore): void => {
  memory = store;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // Kept in memory for the session.
  }
  for (const listener of listeners) listener();
};

export const subscribeOffers = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
