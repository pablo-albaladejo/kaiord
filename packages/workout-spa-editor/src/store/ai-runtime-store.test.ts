/**
 * Co-located test for `useAiRuntimeStore`.
 *
 * Covers selectForGeneration / setGeneration; invariant I3 (selected
 * fallback) is exercised at the consumer level — see
 * `useAiGeneration.test.tsx`.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { useAiRuntimeStore } from "./ai-runtime-store";

describe("useAiRuntimeStore", () => {
  beforeEach(() => {
    useAiRuntimeStore.setState({
      selectedProviderId: null,
      generation: { status: "idle" },
    });
  });

  it("starts with no selection and idle generation", () => {
    const state = useAiRuntimeStore.getState();
    expect(state.selectedProviderId).toBeNull();
    expect(state.generation).toEqual({ status: "idle" });
  });

  it("updates selectedProviderId via selectForGeneration", () => {
    useAiRuntimeStore.getState().selectForGeneration("p-1");
    expect(useAiRuntimeStore.getState().selectedProviderId).toBe("p-1");

    useAiRuntimeStore.getState().selectForGeneration(null);
    expect(useAiRuntimeStore.getState().selectedProviderId).toBeNull();
  });

  it("updates generation via setGeneration", () => {
    useAiRuntimeStore.getState().setGeneration({ status: "loading" });
    expect(useAiRuntimeStore.getState().generation).toEqual({
      status: "loading",
    });

    useAiRuntimeStore
      .getState()
      .setGeneration({ status: "error", message: "boom" });
    expect(useAiRuntimeStore.getState().generation).toEqual({
      status: "error",
      message: "boom",
    });
  });
});
