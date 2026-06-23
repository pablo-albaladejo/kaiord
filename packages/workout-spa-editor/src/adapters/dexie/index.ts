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

import { createDexieAiModelBindingRepository } from "./dexie-ai-model-binding-repository";
import { createDexieAiProviderRepository } from "./dexie-ai-provider-repository";
import { createDexieChatConversationRepository } from "./dexie-chat-conversation-repository";
import { createDexieChatMessageRepository } from "./dexie-chat-message-repository";
import { db } from "./dexie-database";

export const aiProviderRepository = createDexieAiProviderRepository(db);

/** Module-level model-binding repo bound to the production db, for the
 * `useAiModelBindingsLive` live query. */
export const aiModelBindingRepository = createDexieAiModelBindingRepository(db);

/** Module-level chat transcript repo bound to the production db, for the
 * `useChatMessagesLive` live query. */
export const chatMessageRepository = createDexieChatMessageRepository(db);

/** Module-level conversation repo bound to the production db, for the
 * `useChatConversationsLive` live query. */
export const chatConversationRepository =
  createDexieChatConversationRepository(db);
