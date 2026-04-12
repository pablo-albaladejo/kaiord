/**
 * Dexie AI Provider Repository
 *
 * IndexedDB-backed implementation of AiProviderRepository.
 * Encrypts API keys before storing, decrypts after reading.
 */

import { decrypt, encrypt } from "../../lib/crypto";
import type { AiProviderRepository } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { KaiordDatabase } from "./dexie-database";

// Defense-in-depth: protects API keys against casual IndexedDB browsing
// but not against a determined attacker with DevTools access (passphrase
// is in the JS bundle). A user-supplied PIN could strengthen this in v2.
const PASSPHRASE = "kaiord-spa-v1";

async function encryptProvider(
  p: LlmProviderConfig
): Promise<LlmProviderConfig> {
  return { ...p, apiKey: await encrypt(p.apiKey, PASSPHRASE) };
}

async function decryptProvider(
  p: LlmProviderConfig
): Promise<LlmProviderConfig> {
  return { ...p, apiKey: await decrypt(p.apiKey, PASSPHRASE) };
}

export function createDexieAiProviderRepository(
  db: KaiordDatabase
): AiProviderRepository {
  const table = () => db.table("aiProviders");

  return {
    getAll: async () => {
      const all = await table().toArray();
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
  };
}
