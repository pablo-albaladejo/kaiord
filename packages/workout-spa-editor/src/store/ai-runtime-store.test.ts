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

  it("should start with no selection and idle generation", () => {
    // Arrange

    // Act
    const state = useAiRuntimeStore.getState();

    // Assert
    expect(state.selectedProviderId).toBeNull();
    expect(state.generation).toEqual({ status: "idle" });
  });

  it("should update selectedProviderId via selectForGeneration", () => {
    // Arrange
    useAiRuntimeStore.getState().selectForGeneration("p-1");
    expect(useAiRuntimeStore.getState().selectedProviderId).toBe("p-1");

    // Act
    useAiRuntimeStore.getState().selectForGeneration(null);

    // Assert
    expect(useAiRuntimeStore.getState().selectedProviderId).toBeNull();
  });

  it("should update generation via setGeneration", () => {
    // Arrange
    useAiRuntimeStore.getState().setGeneration({ status: "loading" });
    expect(useAiRuntimeStore.getState().generation).toEqual({
      status: "loading",
    });

    // Act
    useAiRuntimeStore
      .getState()
      .setGeneration({ status: "error", message: "boom" });

    // Assert
    expect(useAiRuntimeStore.getState().generation).toEqual({
      status: "error",
      message: "boom",
    });
  });
});
