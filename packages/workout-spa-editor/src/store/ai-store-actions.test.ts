import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./ai-store-persistence", () => ({
  persistAiData: vi.fn(),
  loadAiData: vi.fn().mockResolvedValue({
    providers: [
      {
        id: "llm_saved",
        type: "openai",
        apiKey: "sk-saved",
        model: "gpt-4",
        label: "Saved GPT",
        isDefault: true,
      },
    ],
    customPrompt: "saved prompt",
  }),
}));

import { persistAiData, loadAiData } from "./ai-store-persistence";
import { createAiActions } from "./ai-store-actions";
import type { AiStore } from "./ai-store-types";

const mockPersist = vi.mocked(persistAiData);
const mockLoad = vi.mocked(loadAiData);

type StoreState = Pick<
  AiStore,
  "providers" | "customPrompt" | "selectedProviderId" | "hydrated"
>;

const createTestStore = () => {
  let state: StoreState = {
    providers: [],
    customPrompt: "",
    selectedProviderId: null,
    hydrated: false,
  };

  const set = (fn: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => {
    if (typeof fn === "function") {
      state = { ...state, ...fn(state) };
    } else {
      state = { ...state, ...fn };
    }
  };

  const get = () => state as AiStore;
  const actions = createAiActions(set as Parameters<typeof createAiActions>[0], get);

  return { get: () => state, actions };
};

describe("createAiActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hydrate", () => {
    it("should load data from persistence and set hydrated to true", async () => {
      const { get, actions } = createTestStore();

      await actions.hydrate();

      expect(mockLoad).toHaveBeenCalled();
      expect(get().providers).toHaveLength(1);
      expect(get().providers[0].label).toBe("Saved GPT");
      expect(get().customPrompt).toBe("saved prompt");
      expect(get().hydrated).toBe(true);
    });
  });

  describe("addProvider", () => {
    it("should add first provider as default and persist", () => {
      const { get, actions } = createTestStore();

      const id = actions.addProvider({
        type: "anthropic",
        apiKey: "sk-123",
        model: "claude-sonnet-4-5-20241022",
        label: "Claude",
      });

      expect(get().providers).toHaveLength(1);
      expect(get().providers[0].isDefault).toBe(true);
      expect(get().providers[0].id).toBe(id);
      expect(get().selectedProviderId).toBe(id);
      expect(mockPersist).toHaveBeenCalled();
    });

    it("should not set second provider as default", () => {
      const { get, actions } = createTestStore();

      actions.addProvider({
        type: "anthropic",
        apiKey: "k1",
        model: "m1",
        label: "First",
      });
      actions.addProvider({
        type: "openai",
        apiKey: "k2",
        model: "m2",
        label: "Second",
      });

      expect(get().providers[0].isDefault).toBe(true);
      expect(get().providers[1].isDefault).toBe(false);
    });
  });

  describe("removeProvider", () => {
    it("should remove provider and reassign default when removing default", () => {
      const { get, actions } = createTestStore();
      const id1 = actions.addProvider({
        type: "anthropic",
        apiKey: "k1",
        model: "m1",
        label: "L1",
      });
      actions.addProvider({
        type: "openai",
        apiKey: "k2",
        model: "m2",
        label: "L2",
      });

      actions.removeProvider(id1);

      expect(get().providers).toHaveLength(1);
      expect(get().providers[0].isDefault).toBe(true);
      expect(mockPersist).toHaveBeenCalled();
    });

    it("should update selectedProviderId when removing selected provider", () => {
      const { get, actions } = createTestStore();
      const id1 = actions.addProvider({
        type: "anthropic",
        apiKey: "k1",
        model: "m1",
        label: "L1",
      });

      actions.removeProvider(id1);

      expect(get().selectedProviderId).toBeNull();
    });
  });

  describe("updateProvider", () => {
    it("should update provider fields and persist", () => {
      const { get, actions } = createTestStore();
      const id = actions.addProvider({
        type: "anthropic",
        apiKey: "k1",
        model: "old-model",
        label: "L1",
      });

      actions.updateProvider(id, { model: "new-model" });

      expect(get().providers[0].model).toBe("new-model");
      expect(mockPersist).toHaveBeenCalled();
    });
  });

  describe("setDefault", () => {
    it("should change default provider and persist", () => {
      const { get, actions } = createTestStore();
      actions.addProvider({
        type: "anthropic",
        apiKey: "k1",
        model: "m1",
        label: "L1",
      });
      const id2 = actions.addProvider({
        type: "openai",
        apiKey: "k2",
        model: "m2",
        label: "L2",
      });

      actions.setDefault(id2);

      expect(get().providers[0].isDefault).toBe(false);
      expect(get().providers[1].isDefault).toBe(true);
      expect(mockPersist).toHaveBeenCalled();
    });
  });

  describe("setCustomPrompt", () => {
    it("should set custom prompt and persist", () => {
      const { get, actions } = createTestStore();

      actions.setCustomPrompt("keep it easy");

      expect(get().customPrompt).toBe("keep it easy");
      expect(mockPersist).toHaveBeenCalled();
    });
  });
});
