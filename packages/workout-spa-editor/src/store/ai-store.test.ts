import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAiStore } from "./ai-store";

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

const resetStore = () =>
  useAiStore.setState({
    providers: [],
    customPrompt: "",
    selectedProviderId: null,
    generation: { status: "idle" },
    hydrated: false,
  });

describe("ai-store", () => {
  beforeEach(() => resetStore());

  it("should start with empty providers", () => {
    expect(useAiStore.getState().providers).toHaveLength(0);
  });

  it("should add a provider and set it as default if first", () => {
    const id = useAiStore.getState().addProvider({
      type: "anthropic",
      apiKey: "sk-123",
      model: "claude-sonnet-4-5-20241022",
      label: "My Claude",
    });

    const { providers } = useAiStore.getState();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe(id);
    expect(providers[0].isDefault).toBe(true);
    expect(providers[0].type).toBe("anthropic");
  });

  it("should not set second provider as default", () => {
    const store = useAiStore.getState();
    store.addProvider({
      type: "anthropic",
      apiKey: "k1",
      model: "m1",
      label: "L1",
    });
    store.addProvider({
      type: "openai",
      apiKey: "k2",
      model: "m2",
      label: "L2",
    });

    const { providers } = useAiStore.getState();
    expect(providers[0].isDefault).toBe(true);
    expect(providers[1].isDefault).toBe(false);
  });

  it("should remove a provider and reassign default", () => {
    const store = useAiStore.getState();
    const id1 = store.addProvider({
      type: "anthropic",
      apiKey: "k1",
      model: "m1",
      label: "L1",
    });
    store.addProvider({
      type: "openai",
      apiKey: "k2",
      model: "m2",
      label: "L2",
    });

    useAiStore.getState().removeProvider(id1);

    const { providers } = useAiStore.getState();
    expect(providers).toHaveLength(1);
    expect(providers[0].isDefault).toBe(true);
  });

  it("should update a provider", () => {
    const id = useAiStore.getState().addProvider({
      type: "anthropic",
      apiKey: "k1",
      model: "old",
      label: "L1",
    });

    useAiStore.getState().updateProvider(id, { model: "new-model" });

    expect(useAiStore.getState().providers[0].model).toBe("new-model");
  });

  it("should change default provider", () => {
    const store = useAiStore.getState();
    store.addProvider({
      type: "anthropic",
      apiKey: "k1",
      model: "m1",
      label: "L1",
    });
    const id2 = store.addProvider({
      type: "openai",
      apiKey: "k2",
      model: "m2",
      label: "L2",
    });

    useAiStore.getState().setDefault(id2);

    const { providers } = useAiStore.getState();
    expect(providers[0].isDefault).toBe(false);
    expect(providers[1].isDefault).toBe(true);
  });

  it("should select provider for generation", () => {
    const id = useAiStore.getState().addProvider({
      type: "google",
      apiKey: "k1",
      model: "m1",
      label: "L1",
    });

    useAiStore.getState().selectForGeneration(id);

    expect(useAiStore.getState().selectedProviderId).toBe(id);
  });

  it("should get selected provider (falls back to default)", () => {
    const store = useAiStore.getState();
    store.addProvider({
      type: "anthropic",
      apiKey: "k1",
      model: "m1",
      label: "Claude",
    });

    const selected = useAiStore.getState().getSelectedProvider();

    expect(selected?.label).toBe("Claude");
  });

  it("should set custom prompt", () => {
    useAiStore.getState().setCustomPrompt("keep it easy");

    expect(useAiStore.getState().customPrompt).toBe("keep it easy");
  });

  it("should track generation state", () => {
    const store = useAiStore.getState();

    store.setGeneration({ status: "loading" });
    expect(useAiStore.getState().generation.status).toBe("loading");

    store.setGeneration({ status: "error", message: "fail" });
    expect(useAiStore.getState().generation.status).toBe("error");

    store.setGeneration({ status: "success" });
    expect(useAiStore.getState().generation.status).toBe("success");
  });

  it("should hydrate providers from persistence", async () => {
    expect(useAiStore.getState().hydrated).toBe(false);

    await useAiStore.getState().hydrate();

    const state = useAiStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.providers).toHaveLength(1);
    expect(state.providers[0].label).toBe("Saved GPT");
    expect(state.customPrompt).toBe("saved prompt");
  });
});
