/**
 * Dexie adapters barrel.
 *
 * `aiProviderRepository` is the module-level singleton bound to the
 * production Dexie database. Live read hooks (`useAiProvidersLive`)
 * close over this instance so every render observes the same underlying
 * IndexedDB connection. The repository decrypts API keys at the read
 * boundary, so callers always receive plaintext.
 *
 * Tests import this same module under jsdom + fake-indexeddb; the
 * encryption pipeline is exercised end-to-end without divergence.
 *
 * HMR caveat: a hot reload may briefly produce two repository instances
 * sharing the same `db` connection. This is acceptable in dev and
 * cannot occur in production builds.
 */

import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";
import { db } from "./dexie-database";

export const aiProviderRepository = createDexieAiProviderRepository(db);
