import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../adapters/bridge/bridge-transport";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { useBridgeThemePush } from "./use-bridge-theme-push";
import type { DiscoveredBridge } from "./use-discovered-bridges";
import { useDiscoveredBridges } from "./use-discovered-bridges";

vi.mock("../adapters/bridge/bridge-transport", () => ({
  sendBridgeMessage: vi.fn(),
}));
vi.mock("./use-discovered-bridges", () => ({
  useDiscoveredBridges: vi.fn(),
}));

const mockedSend = vi.mocked(sendBridgeMessage);
const mockedBridges = vi.mocked(useDiscoveredBridges);

const TRAIN2GO: DiscoveredBridge = {
  bridgeId: "train2go-bridge",
  extensionId: "ext-t2g",
};
const GARMIN: DiscoveredBridge = {
  bridgeId: "garmin-bridge",
  extensionId: "ext-garmin",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
);

const renderPush = () =>
  renderHook(
    () => {
      useBridgeThemePush();
      return useTheme();
    },
    { wrapper }
  );

// The shared queue defers each send by a zero-delay timer; two macrotask
// turns let a queued send (and its acknowledgement) run to completion.
const settleQueue = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const themeMessagesTo = (extensionId: string) =>
  mockedSend.mock.calls
    .filter(([id]) => id === extensionId)
    .map(([, message]) => message);

describe("useBridgeThemePush", () => {
  beforeEach(() => {
    localStorage.clear();
    mockedSend.mockResolvedValue({ ok: true, delivered: true, data: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should send the current preference to every discovered bridge", async () => {
    // Arrange
    mockedBridges.mockReturnValue([TRAIN2GO, GARMIN]);

    // Act
    renderPush();

    // Assert
    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(2));
    expect(themeMessagesTo("ext-t2g")).toEqual([
      { action: "set-theme", theme: "system" },
    ]);
    expect(themeMessagesTo("ext-garmin")).toEqual([
      { action: "set-theme", theme: "system" },
    ]);
  });

  it("should send the new preference when the user changes theme", async () => {
    // Arrange
    mockedBridges.mockReturnValue([TRAIN2GO]);
    const { result } = renderPush();
    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));

    // Act
    act(() => result.current.setTheme("light"));

    // Assert
    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(2));
    expect(themeMessagesTo("ext-t2g").at(-1)).toEqual({
      action: "set-theme",
      theme: "light",
    });
  });

  it("should not resend a preference a bridge already accepted", async () => {
    // Arrange
    mockedBridges.mockReturnValue([TRAIN2GO]);
    const { rerender } = renderPush();
    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));
    await settleQueue();

    // Act
    mockedBridges.mockReturnValue([{ ...TRAIN2GO }]);
    rerender();
    await settleQueue();

    // Assert
    expect(mockedSend).toHaveBeenCalledTimes(1);
  });

  it("should send to a bridge discovered after the theme was set", async () => {
    // Arrange
    mockedBridges.mockReturnValue([]);
    const { result, rerender } = renderPush();
    act(() => result.current.setTheme("dark"));

    // Act
    mockedBridges.mockReturnValue([GARMIN]);
    rerender();

    // Assert
    await waitFor(() =>
      expect(themeMessagesTo("ext-garmin")).toEqual([
        { action: "set-theme", theme: "dark" },
      ])
    );
  });

  it("should resend to a bridge that refused the preference", async () => {
    // Arrange
    mockedSend.mockResolvedValueOnce({
      ok: false,
      delivered: true,
      error: "Origin or action not permitted",
    });
    mockedBridges.mockReturnValue([TRAIN2GO]);
    const { rerender } = renderPush();
    await waitFor(() => expect(mockedSend).toHaveBeenCalledTimes(1));

    // Act
    mockedBridges.mockReturnValue([{ ...TRAIN2GO }]);
    rerender();

    // Assert
    await waitFor(() =>
      expect(themeMessagesTo("ext-t2g")).toEqual([
        { action: "set-theme", theme: "system" },
        { action: "set-theme", theme: "system" },
      ])
    );
  });
});
