import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, it, expect } from "vitest";

import {
  SettingsDialogProvider,
  useSettingsDialog,
} from "./settings-dialog-context";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsDialogProvider>{children}</SettingsDialogProvider>
);

describe("settings-dialog-context", () => {
  it("should start closed", () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    expect(result.current.open).toBe(false);
  });

  it("should open when show is called", () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => result.current.show());

    expect(result.current.open).toBe(true);
  });

  it("should close when hide is called", () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => result.current.show());
    act(() => result.current.hide());

    expect(result.current.open).toBe(false);
  });

  it("should toggle from closed to open", () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => result.current.toggle());

    expect(result.current.open).toBe(true);
  });

  it("should toggle from open to closed", () => {
    const { result } = renderHook(() => useSettingsDialog(), { wrapper });

    act(() => result.current.show());
    act(() => result.current.toggle());

    expect(result.current.open).toBe(false);
  });

  it("should throw when used outside provider", () => {
    expect(() => {
      renderHook(() => useSettingsDialog());
    }).toThrow("useSettingsDialog must be used within SettingsDialogProvider");
  });
});
