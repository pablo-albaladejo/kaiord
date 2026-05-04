import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  SettingsDialogProvider,
  useSettingsDialog,
} from "./settings-dialog-context";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsDialogProvider>{children}</SettingsDialogProvider>
);

describe("settings-dialog-context", () => {
  it("should start closed", () => {
    // Arrange

    // Act

    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    // Assert

    expect(result.current.open).toBe(false);
  });

  it("should open when show is called", () => {
    // Arrange

    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    // Act

    act(() => result.current.show());

    // Assert

    expect(result.current.open).toBe(true);
  });

  it("should close when hide is called", () => {
    // Arrange

    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => result.current.show());

    // Act

    act(() => result.current.hide());

    // Assert

    expect(result.current.open).toBe(false);
  });

  it("should toggle from closed to open", () => {
    // Arrange

    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    // Act

    act(() => result.current.toggle());

    // Assert

    expect(result.current.open).toBe(true);
  });

  it("should toggle from open to closed", () => {
    // Arrange

    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => result.current.show());

    // Act

    act(() => result.current.toggle());

    // Assert

    expect(result.current.open).toBe(false);
  });

  it("should throw when used outside provider", () => {
    // Arrange

    // Act

    // Assert
    expect(() => {
      renderHook(() => useSettingsDialog());
    }).toThrow("useSettingsDialog must be used within SettingsDialogProvider");
  });
});
