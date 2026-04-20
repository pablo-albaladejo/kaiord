import { describe, expect, it } from "vitest";

import { block, id, step, workout } from "./_fixtures";
import { restoredAfterUndoTarget } from "./restored-after-undo";

describe("restoredAfterUndoTarget", () => {
  it("returns the restored item id when present in the workout", () => {
    const w = workout([step("a"), step("b")]);

    expect(restoredAfterUndoTarget(w, id("b"))).toEqual({
      kind: "item",
      id: id("b"),
    });
  });

  it("returns empty-state when the id is not present", () => {
    const w = workout([step("a")]);

    expect(restoredAfterUndoTarget(w, id("missing"))).toEqual({
      kind: "empty-state",
    });
  });

  it("finds items nested inside a repetition block", () => {
    const blk = block("blk", [step("b1")]);
    const w = workout([blk]);

    expect(restoredAfterUndoTarget(w, id("b1"))).toEqual({
      kind: "item",
      id: id("b1"),
    });
  });
});
