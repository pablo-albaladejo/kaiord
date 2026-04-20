import { describe, expect, it } from "vitest";
import { create } from "zustand";

import { asItemId } from "../providers/item-id";
import { createFocusSlice } from "./focus-slice";
import type { FocusSlice } from "./focus-slice.types";

const makeStore = () => create<FocusSlice>()((set) => createFocusSlice(set));

describe("FocusSlice", () => {
  it("initialises pendingFocusTarget to null and selectionHistory to []", () => {
    const store = makeStore();

    expect(store.getState().pendingFocusTarget).toBeNull();
    expect(store.getState().selectionHistory).toEqual([]);
  });

  it("setPendingFocusTarget(null) clears the target", () => {
    const store = makeStore();

    store.getState().setPendingFocusTarget({
      kind: "item",
      id: asItemId("a"),
    });
    store.getState().setPendingFocusTarget(null);

    expect(store.getState().pendingFocusTarget).toBeNull();
  });

  it("writes the latest target on repeated sets", () => {
    const store = makeStore();

    store.getState().setPendingFocusTarget({
      kind: "item",
      id: asItemId("first"),
    });
    store.getState().setPendingFocusTarget({
      kind: "item",
      id: asItemId("second"),
    });

    expect(store.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: "second",
    });
  });

  it("accepts an id that does not match any item without throwing", () => {
    const store = makeStore();

    expect(() =>
      store.getState().setPendingFocusTarget({
        kind: "item",
        id: asItemId("unresolved"),
      })
    ).not.toThrow();
    expect(store.getState().pendingFocusTarget).toEqual({
      kind: "item",
      id: "unresolved",
    });
  });

  it("accepts empty-state kind", () => {
    const store = makeStore();

    store.getState().setPendingFocusTarget({ kind: "empty-state" });

    expect(store.getState().pendingFocusTarget).toEqual({
      kind: "empty-state",
    });
  });
});
