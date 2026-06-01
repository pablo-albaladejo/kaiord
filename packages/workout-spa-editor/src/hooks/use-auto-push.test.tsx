import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAutoPush } from "./use-auto-push";

describe("useAutoPush", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should NOT request a push on the first render", () => {
    // Arrange
    const requestPush = vi.fn();

    // Act
    renderHook(({ token }) => useAutoPush(token, requestPush), {
      initialProps: { token: 0 },
    });

    // Assert
    expect(requestPush).not.toHaveBeenCalled();
  });

  it("should request a push once per change token transition", () => {
    // Arrange
    const requestPush = vi.fn();
    const { rerender } = renderHook(
      ({ token }) => useAutoPush(token, requestPush),
      { initialProps: { token: 0 } }
    );

    // Act
    act(() => rerender({ token: 1 }));
    act(() => rerender({ token: 2 }));

    // Assert
    expect(requestPush).toHaveBeenCalledTimes(2);
  });

  it("should NOT request a push when the token is unchanged", () => {
    // Arrange
    const requestPush = vi.fn();
    const { rerender } = renderHook(
      ({ token }) => useAutoPush(token, requestPush),
      { initialProps: { token: 5 } }
    );

    // Act
    act(() => rerender({ token: 5 }));

    // Assert
    expect(requestPush).not.toHaveBeenCalled();
  });
});
