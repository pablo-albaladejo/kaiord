import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GarminBridgeProvider, useGarminBridge } from "./garmin-bridge-context";

vi.mock("../store/garmin-extension-transport", () => ({
  ping: vi.fn().mockResolvedValue({ ok: false }),
  sendMessage: vi.fn().mockResolvedValue({ ok: false }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <GarminBridgeProvider>{children}</GarminBridgeProvider>
);

describe("garmin-bridge-context", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    expect(result.current.extensionInstalled).toBe(false);
    expect(result.current.sessionActive).toBe(false);
    expect(result.current.pushing).toEqual({ status: "idle" });
    expect(result.current.lastError).toBeNull();
  });

  it("should update pushing state", () => {
    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    act(() => result.current.setPushing({ status: "loading" }));

    expect(result.current.pushing).toEqual({ status: "loading" });
  });

  it("should set push error state", () => {
    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    act(() =>
      result.current.setPushing({
        status: "error",
        message: "Push failed",
      })
    );

    expect(result.current.pushing).toEqual({
      status: "error",
      message: "Push failed",
    });
  });

  it("should set push success state", () => {
    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    act(() => result.current.setPushing({ status: "success" }));

    expect(result.current.pushing).toEqual({ status: "success" });
  });

  it("should throw when used outside provider", () => {
    expect(() => {
      renderHook(() => useGarminBridge());
    }).toThrow("useGarminBridge must be used within GarminBridgeProvider");
  });
});
