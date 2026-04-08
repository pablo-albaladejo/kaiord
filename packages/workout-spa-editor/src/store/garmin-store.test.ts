import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGarminStore } from "./garmin-store";

describe("garmin-store", () => {
  beforeEach(() => {
    useGarminStore.setState({
      extensionInstalled: false,
      sessionActive: false,
      pushing: { status: "idle" },
      lastError: null,
      lastDetectionTimestamp: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default state", () => {
    const state = useGarminStore.getState();

    expect(state.extensionInstalled).toBe(false);
    expect(state.sessionActive).toBe(false);
    expect(state.pushing).toEqual({ status: "idle" });
    expect(state.lastError).toBeNull();
    expect(state.lastDetectionTimestamp).toBeNull();
  });

  it("updates pushing state", () => {
    useGarminStore.getState().setPushing({ status: "loading" });

    expect(useGarminStore.getState().pushing).toEqual({ status: "loading" });
  });

  it("sets push error state", () => {
    useGarminStore.getState().setPushing({
      status: "error",
      message: "Push failed",
    });

    expect(useGarminStore.getState().pushing).toEqual({
      status: "error",
      message: "Push failed",
    });
  });

  it("sets push success state", () => {
    useGarminStore.getState().setPushing({ status: "success" });

    expect(useGarminStore.getState().pushing).toEqual({ status: "success" });
  });
});
