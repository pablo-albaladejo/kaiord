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
    // Arrange

    // Act

    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    // Assert

    expect(result.current.extensionInstalled).toBe(false);
    expect(result.current.sessionActive).toBe(false);
    expect(result.current.pushing).toEqual({ status: "idle" });
    expect(result.current.lastError).toBeNull();
  });

  it("should update pushing state", () => {
    // Arrange

    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    // Act

    act(() => result.current.setPushing({ status: "loading" }));

    // Assert

    expect(result.current.pushing).toEqual({ status: "loading" });
  });

  it("should set push error state", () => {
    // Arrange

    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    // Act

    act(() =>
      result.current.setPushing({
        status: "error",
        message: "Push failed",
      })
    );

    // Assert

    expect(result.current.pushing).toEqual({
      status: "error",
      message: "Push failed",
    });
  });

  it("should set push success state", () => {
    // Arrange

    const { result } = renderHook(() => useGarminBridge(), { wrapper });

    // Act

    act(() => result.current.setPushing({ status: "success" }));

    // Assert

    expect(result.current.pushing).toEqual({ status: "success" });
  });

  it("should throw when used outside provider", () => {
    // Arrange

    // Act

    // Assert
    expect(() => {
      renderHook(() => useGarminBridge());
    }).toThrow("useGarminBridge must be used within GarminBridgeProvider");
  });
});
