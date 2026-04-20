import { describe, expect, it } from "vitest";

import { block, id, step, workout } from "./_fixtures";
import { nextAfterDelete } from "./next-after-delete";

describe("nextAfterDelete", () => {
  it("main-list next sibling when item is not last", () => {
    const w = workout([step("a"), step("b"), step("c")]);

    expect(nextAfterDelete(w, id("b"))).toEqual({
      kind: "item",
      id: id("c"),
    });
  });

  it("main-list previous sibling when deleted item is last", () => {
    const w = workout([step("a"), step("b"), step("c")]);

    expect(nextAfterDelete(w, id("c"))).toEqual({
      kind: "item",
      id: id("b"),
    });
  });

  it("main-list empty-state when deleting the only remaining item", () => {
    const w = workout([step("a")]);

    expect(nextAfterDelete(w, id("a"))).toEqual({ kind: "empty-state" });
  });

  it("block-child next sibling when not last", () => {
    const blk = block("blk", [step("b1"), step("b2"), step("b3")]);
    const w = workout([step("a"), blk, step("c")]);

    expect(nextAfterDelete(w, id("b1"), id("blk"))).toEqual({
      kind: "item",
      id: id("b2"),
    });
  });

  it("block-child previous sibling when deleting last step in block", () => {
    const blk = block("blk", [step("b1"), step("b2")]);
    const w = workout([blk]);

    expect(nextAfterDelete(w, id("b2"), id("blk"))).toEqual({
      kind: "item",
      id: id("b1"),
    });
  });

  it("block-child last-remaining cascades to main-list next sibling", () => {
    const blk = block("blk", [step("b1")]);
    const w = workout([step("a"), blk, step("c")]);

    expect(nextAfterDelete(w, id("b1"), id("blk"))).toEqual({
      kind: "item",
      id: id("c"),
    });
  });

  it("block-child last-remaining cascades to empty-state when block was the only item", () => {
    const blk = block("blk", [step("b1")]);
    const w = workout([blk]);

    expect(nextAfterDelete(w, id("b1"), id("blk"))).toEqual({
      kind: "empty-state",
    });
  });

  it("returns empty-state when deleted id is not present", () => {
    const w = workout([step("a")]);

    expect(nextAfterDelete(w, id("zzz"))).toEqual({ kind: "empty-state" });
  });
});
