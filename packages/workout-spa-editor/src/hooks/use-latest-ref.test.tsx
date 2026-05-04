import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useLatestRef } from "./use-latest-ref";

describe("useLatestRef", () => {
  it("should return the initial value via ref.current after mount", () => {
    const { result } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: "initial" },
    });

    expect(result.current.current).toBe("initial");
  });

  it("updates ref.current to the latest render's value", () => {
    const { result, rerender } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: 1 },
    });
    const firstRef = result.current;

    rerender({ v: 2 });

    expect(result.current.current).toBe(2);
    // ref identity is stable across renders.
    expect(result.current).toBe(firstRef);
  });

  it("should preserve the ref identity across renders", () => {
    const { result, rerender } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: "a" },
    });
    const initial = result.current;

    rerender({ v: "b" });
    rerender({ v: "c" });

    expect(result.current).toBe(initial);
    expect(result.current.current).toBe("c");
  });
});
