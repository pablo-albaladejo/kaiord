import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { hasUnsavedEdits } from "./unsaved-edits";
import { useUnsavedWork } from "./use-unsaved-work";

describe("useUnsavedWork", () => {
  it("should report while active, and stop on clear and on unmount", () => {
    // Arrange
    const hook = renderHook(({ active }) => useUnsavedWork(active), {
      initialProps: { active: true },
    });

    // Act
    const whileActive = hasUnsavedEdits();
    hook.rerender({ active: false });
    const afterClear = hasUnsavedEdits();
    hook.rerender({ active: true });
    hook.unmount();

    // Assert
    expect(whileActive).toBe(true);
    expect(afterClear).toBe(false);
    expect(hasUnsavedEdits()).toBe(false);
  });
});
