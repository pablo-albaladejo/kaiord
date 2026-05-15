/**
 * Dexie Database Schema
 *
 * IndexedDB database definition for the workout SPA editor.
 * Uses Dexie.js class syntax (required by the library).
 */

import Dexie from "dexie";

import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";
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

// Expose for e2e test seeding (dev mode only)
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__KAIORD_DB__ = db;
  const aiRepo = createDexieAiProviderRepository(db);
  w.__KAIORD_E2E_SEED__ = { aiProvider: aiRepo.put };
}
