/**
 * Co-located test for `useAiProvidersLive`.
 *
 * Verifies (a) the hook resolves the persisted list, (b) the apiKey
 * arrives in plaintext (the repository's decryption pass is
 * exercised), (c) the underlying Dexie row stores ciphertext
 * (encryption-at-rest invariant), and (d) the live query re-fires
 * when a new provider is written through PersistencePort.
 */

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import type { LlmProviderConfig } from "../store/ai-store-types";
import { useAiProvidersLive } from "./use-ai-providers-live";

const makeProvider = (
  id: string,
  apiKey: string,
  isDefault = true,
  createdAt = 0
): LlmProviderConfig => ({
  id,
  type: "anthropic",
  apiKey,
  model: "claude-sonnet-4-5",
  label: "Test",
  isDefault,
  createdAt,
});

const clear = () => db.table("aiProviders").clear();

describe("useAiProvidersLive", () => {
  beforeEach(clear);
  afterEach(clear);

  it("should resolve with plaintext apiKey while keeping ciphertext at rest", async () => {
    const persistence = createDexiePersistence(db);
    const provider = makeProvider("p1", "sk-plaintext");
    await persistence.aiProviders.put(provider);

    const { result } = renderHook(() => useAiProvidersLive());

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    expect(result.current?.[0].apiKey).toBe("sk-plaintext");

    const stored = await db.table("aiProviders").get("p1");
    expect(stored.apiKey).not.toBe("sk-plaintext");
  });

  it("should re-fire when a provider is written through PersistencePort", async () => {
    const persistence = createDexiePersistence(db);

    const { result } = renderHook(() => useAiProvidersLive());

    await waitFor(() => {
      expect(result.current).toEqual([]);
    });

    await persistence.aiProviders.put(makeProvider("p2", "sk-second"));

    await waitFor(() => {
      expect(result.current).toHaveLength(1);
      expect(result.current?.[0].id).toBe("p2");
      expect(result.current?.[0].apiKey).toBe("sk-second");
    });
  });
});
