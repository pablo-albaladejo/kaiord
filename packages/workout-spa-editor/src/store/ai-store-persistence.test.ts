import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/secure-storage", () => {
  const store = new Map<string, string>();
  return {
    createSecureStorage: () => ({
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      remove: vi.fn((key: string) => store.delete(key)),
      has: vi.fn((key: string) => store.has(key)),
      clearAll: vi.fn(() => store.clear()),
      _store: store,
    }),
  };
});

import { createSecureStorage } from "../lib/secure-storage";
import { loadAiData, persistAiData } from "./ai-store-persistence";
import type { LlmProviderConfig } from "./ai-store-types";

const mockStorage = createSecureStorage("test") as ReturnType<
  typeof createSecureStorage
> & { _store: Map<string, string> };

describe("ai-store-persistence", () => {
  beforeEach(() => {
    mockStorage._store.clear();
  });

  it("should persist and load providers round-trip", async () => {
    const providers: Array<LlmProviderConfig> = [
      {
        id: "llm_1",
        type: "anthropic",
        apiKey: "sk-test",
        model: "claude-sonnet-4-5-20241022",
        label: "My Claude",
        isDefault: true,
      },
    ];

    await persistAiData({ providers, customPrompt: "keep it short" });
    const loaded = await loadAiData();

    expect(loaded.providers).toEqual(providers);
    expect(loaded.customPrompt).toBe("keep it short");
  });

  it("should return empty data when nothing is stored", async () => {
    const loaded = await loadAiData();

    expect(loaded.providers).toEqual([]);
    expect(loaded.customPrompt).toBe("");
  });

  it("should return empty data on corrupt storage", async () => {
    mockStorage._store.set("ai_providers", "not-json");
    vi.mocked(mockStorage.get).mockRejectedValueOnce(new Error("decrypt fail"));

    const loaded = await loadAiData();

    expect(loaded.providers).toEqual([]);
    expect(loaded.customPrompt).toBe("");
  });
});
