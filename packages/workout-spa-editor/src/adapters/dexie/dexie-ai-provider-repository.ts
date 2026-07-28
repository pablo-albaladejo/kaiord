/**
 * Dexie AI Provider Repository
 *
 * IndexedDB-backed implementation of AiProviderRepository.
 * Encrypts API keys before storing, decrypts after reading.
 */

import Dexie from "dexie";

import { decrypt, encrypt } from "../../lib/crypto";
import type { AiProviderRepository } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { KaiordDatabase } from "./dexie-database";

// Defense-in-depth: protects API keys against casual IndexedDB browsing
// but not against a determined attacker with DevTools access (passphrase
// is in the JS bundle). A user-supplied PIN could strengthen this in v2.
const PASSPHRASE = "kaiord-spa-v1";

// WebCrypto promises are not Dexie promises: awaiting one inside a Dexie
// transaction lets the IDB transaction auto-commit first (PrematureCommitError).
// `Dexie.waitFor` keeps the transaction alive across the await, and is a plain
// pass-through when there is no transaction in scope. Required since these
// repos are called from inside `PersistencePort.transaction` — e.g. the
// `withTombstones` existence probe before a provider delete.
async function encryptProvider(
  p: LlmProviderConfig
): Promise<LlmProviderConfig> {
  return { ...p, apiKey: await Dexie.waitFor(encrypt(p.apiKey, PASSPHRASE)) };
}

async function decryptProvider(
  p: LlmProviderConfig
): Promise<LlmProviderConfig> {
  return { ...p, apiKey: await Dexie.waitFor(decrypt(p.apiKey, PASSPHRASE)) };
}

const CUSTOM_PROMPT_KEY = "ai_custom_prompt";

export function createDexieAiProviderRepository(
  db: KaiordDatabase
): AiProviderRepository {
  const table = () => db.table("aiProviders");
  const meta = () => db.table("meta");

  return {
    getAll: async () => {
      // orderBy("createdAt") guarantees insertion-order surfacing so
      // the ModelSelector / SettingsPanel listings are stable across
      // reloads. PK-default ordering (UUID) is essentially random.
      // Supersedes the locale-aware label sort that landed in main —
      // insertion order matches the user's mental model of "the one I
      // added most recently is at the bottom" better than alphabetical.
      const all = await table().orderBy("createdAt").toArray();
      return Promise.all(all.map(decryptProvider));
    },

    getById: async (id) => {
      const p = await table().get(id);
      return p ? decryptProvider(p) : undefined;
    },

    put: async (provider) => {
      await table().put(await encryptProvider(provider));
    },

    delete: async (id) => {
      await table().delete(id);
    },

    getCustomPrompt: async () => {
      const row = await meta().get(CUSTOM_PROMPT_KEY);
      return typeof row?.value === "string" ? row.value : null;
    },

    setCustomPrompt: async (prompt) => {
      await meta().put({ key: CUSTOM_PROMPT_KEY, value: prompt });
    },
  };
}
