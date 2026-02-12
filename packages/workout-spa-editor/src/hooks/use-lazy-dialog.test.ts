import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLazyDialog } from "./use-lazy-dialog";

describe("useLazyDialog", () => {
  it("should start closed and unmounted by default", () => {
    const { result } = renderHook(() => useLazyDialog());

    expect(result.current.open).toBe(false);
    expect(result.current.mounted).toBe(false);
  });

  it("should start open and mounted when initialOpen is true", () => {
    const { result } = renderHook(() => useLazyDialog(true));

    expect(result.current.open).toBe(true);
    expect(result.current.mounted).toBe(true);
  });

  it("should mount and open on show()", () => {
    const { result } = renderHook(() => useLazyDialog());

    act(() => result.current.show());

    expect(result.current.open).toBe(true);
    expect(result.current.mounted).toBe(true);
  });

  it("should stay mounted after closing", () => {
    const { result } = renderHook(() => useLazyDialog());

    act(() => result.current.show());
    act(() => result.current.setOpen(false));

    expect(result.current.open).toBe(false);
    expect(result.current.mounted).toBe(true);
  });
});
