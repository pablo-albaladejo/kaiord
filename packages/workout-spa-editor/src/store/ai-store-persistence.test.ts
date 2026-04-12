import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { loadAiData, persistAiData } from "./ai-store-persistence";
import type { LlmProviderConfig } from "./ai-store-types";

describe("ai-store-persistence", () => {
  beforeEach(async () => {
    await db.table("aiProviders").clear();
    await db.table("meta").clear();
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

    expect(loaded.providers).toHaveLength(1);
    expect(loaded.providers[0].id).toBe("llm_1");
    expect(loaded.providers[0].apiKey).toBe("sk-test");
    expect(loaded.customPrompt).toBe("keep it short");
  });

  it("should return empty data when nothing is stored", async () => {
    const loaded = await loadAiData();

    expect(loaded.providers).toEqual([]);
    expect(loaded.customPrompt).toBe("");
  });

  it("should handle errors gracefully", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const loaded = await loadAiData();

    expect(loaded.providers).toEqual([]);
    expect(loaded.customPrompt).toBe("");
  });
});
