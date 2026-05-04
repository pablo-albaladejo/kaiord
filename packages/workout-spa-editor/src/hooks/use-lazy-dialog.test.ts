import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLazyDialog } from "./use-lazy-dialog";

describe("useLazyDialog", () => {
  it("should start closed and unmounted by default", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useLazyDialog());

    // Assert
    expect(result.current.open).toBe(false);
    expect(result.current.mounted).toBe(false);
  });

  it("should start open and mounted when initialOpen is true", () => {
    // Arrange

    // Act
    const { result } = renderHook(() => useLazyDialog(true));

    // Assert
    expect(result.current.open).toBe(true);
    expect(result.current.mounted).toBe(true);
  });

  it("should mount and open on show()", () => {
    // Arrange
    const { result } = renderHook(() => useLazyDialog());

    // Act
    act(() => result.current.show());

    // Assert
    expect(result.current.open).toBe(true);
    expect(result.current.mounted).toBe(true);
  });

  it("should stay mounted after closing", () => {
    // Arrange
    const { result } = renderHook(() => useLazyDialog());
    act(() => result.current.show());

    // Act
    act(() => result.current.setOpen(false));

    // Assert
    expect(result.current.open).toBe(false);
    expect(result.current.mounted).toBe(true);
  });
});
