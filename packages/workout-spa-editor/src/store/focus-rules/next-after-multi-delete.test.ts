import { describe, expect, it } from "vitest";

import { block, id, step, workout } from "./_fixtures";
import { nextAfterMultiDelete } from "./next-after-multi-delete";

describe("nextAfterMultiDelete", () => {
  it("picks the first remaining item after the last deleted position", () => {
    const w = workout([step("a"), step("b"), step("c"), step("d")]);

    expect(nextAfterMultiDelete(w, [id("a"), id("b")])).toEqual({
      kind: "item",
      id: id("c"),
    });
  });

  it("falls back to the previous-sibling of the first deleted when nothing remains after", () => {
    const w = workout([step("a"), step("b"), step("c"), step("d")]);

    expect(nextAfterMultiDelete(w, [id("c"), id("d")])).toEqual({
      kind: "item",
      id: id("b"),
    });
  });

  it("returns empty-state when every item is deleted", () => {
    const w = workout([step("a"), step("b")]);

    expect(nextAfterMultiDelete(w, [id("a"), id("b")])).toEqual({
      kind: "empty-state",
    });
  });

  it("handles non-contiguous selection by skipping deleted ids", () => {
    const w = workout([step("a"), step("b"), step("c"), step("d"), step("e")]);

    expect(nextAfterMultiDelete(w, [id("b"), id("d")])).toEqual({
      kind: "item",
      id: id("e"),
    });
  });

  it("operates inside a parent block when parentBlockId is provided", () => {
    const blk = block("blk", [step("b1"), step("b2"), step("b3")]);
    const w = workout([blk]);

    expect(nextAfterMultiDelete(w, [id("b1"), id("b2")], id("blk"))).toEqual({
      kind: "item",
      id: id("b3"),
    });
  });

  it("returns empty-state if deletedIds is empty", () => {
    const w = workout([step("a")]);

    expect(nextAfterMultiDelete(w, [])).toEqual({ kind: "empty-state" });
  });
});
