/**
 * Dexie Bridge Repository
 *
 * Persists the bridge registry across browser sessions so the
 * 24h-unavailable and 24h-removed lifecycle timers resume from the
 * stored `lastSeen` / `removedAt` anchors instead of restarting on
 * every reload.
 */

import type {
  BridgeRepository,
  RegisteredBridge,
} from "../bridge/bridge-types";
import type { KaiordDatabase } from "./dexie-database";

export function createDexieBridgeRepository(
  db: KaiordDatabase
): BridgeRepository {
  const table = () => db.table<RegisteredBridge>("bridges");

  return {
    getAll: async () => table().toArray(),
    put: async (bridge) => {
      await table().put(bridge);
    },
    delete: async (extensionId) => {
      await table().delete(extensionId);
    },
  };
}
