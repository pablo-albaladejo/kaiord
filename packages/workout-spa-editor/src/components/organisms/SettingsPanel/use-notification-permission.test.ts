import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useNotificationPermission } from "./use-notification-permission";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useNotificationPermission", () => {
  it("should report unsupported when the Notification API is absent", () => {
    // Arrange
    vi.stubGlobal("Notification", undefined);

    // Act
    const { result } = renderHook(() => useNotificationPermission());

    // Assert
    expect(result.current.permission).toBe("unsupported");
  });

  it("should reflect the granted permission after a request", async () => {
    // Arrange
    const requestPermission = vi.fn().mockResolvedValue("granted");
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    const { result } = renderHook(() => useNotificationPermission());

    // Act
    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.request();
    });

    // Assert
    expect(returned).toBe("granted");
    expect(result.current.permission).toBe("granted");
  });
});
