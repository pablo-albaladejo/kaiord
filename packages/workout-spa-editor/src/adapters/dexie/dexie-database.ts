/**
 * Dexie Database Schema
 *
 * IndexedDB database definition for the workout SPA editor.
 * Uses Dexie.js class syntax (required by the library).
 */

import Dexie from "dexie";

import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";
import { installExportLedgerCascade } from "./dexie-export-ledger-cascade";
import { runJunkCleanupOnce } from "./dexie-junk-cleanup";
import { registerKaiordVersions } from "./register-kaiord-versions";

export {
  backfillBridgeSnapshotState,
  backfillUsageRow,
  makeBackfillAiProviderCreatedAt,
} from "./dexie-migrations";

export class KaiordDatabase extends Dexie {
  constructor(name = "kaiord-spa") {
    super(name);
    registerKaiordVersions(this);
  }
}

export const db = new KaiordDatabase();
installExportLedgerCascade(db);
// Fire-and-forget: returning the promise from a `ready` handler would make
// Dexie block DB readiness (and all queued queries) until the cleanup scan
// completes. `runJunkCleanupOnce` swallows its own errors, so voiding it is safe.
db.on("ready", () => {
  void runJunkCleanupOnce(db);
});

// Expose for e2e test seeding (dev mode only). The `typeof window` guard
// matches the symmetric `__KAIORD_WORKOUT_STORE__` exposure in
// `src/store/workout-store.ts` so this module remains safe to import
// from node tooling that doesn't provide a DOM (SSR-style consumers).
if (import.meta.env.DEV && typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.__KAIORD_DB__ = db;
  const aiRepo = createDexieAiProviderRepository(db);
  w.__KAIORD_E2E_SEED__ = { aiProvider: aiRepo.put };
}
