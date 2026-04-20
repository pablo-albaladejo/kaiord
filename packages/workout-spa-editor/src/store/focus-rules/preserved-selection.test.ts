import { describe, expect, it } from "vitest";

import { id, step, workout } from "./_fixtures";
import { preservedSelectionTarget } from "./preserved-selection";

describe("preservedSelectionTarget", () => {
  it("keeps the prior selection when it still exists", () => {
    const w = workout([step("a"), step("b")]);

    expect(preservedSelectionTarget(w, id("a"), 0)).toEqual({
      kind: "item",
      id: id("a"),
    });
  });

  it("falls back to the same-index item when the prior selection is gone", () => {
    const w = workout([step("a"), step("b")]);

    expect(preservedSelectionTarget(w, id("gone"), 1)).toEqual({
      kind: "item",
      id: id("b"),
    });
  });

  it("returns empty-state when index is out of range and prior selection is gone", () => {
    const w = workout([step("a")]);

    expect(preservedSelectionTarget(w, id("gone"), 5)).toEqual({
      kind: "empty-state",
    });
  });

  it("returns empty-state when previous selection is null and index is out of range", () => {
    const w = workout([]);

    expect(preservedSelectionTarget(w, null, 0)).toEqual({
      kind: "empty-state",
    });
  });
});
