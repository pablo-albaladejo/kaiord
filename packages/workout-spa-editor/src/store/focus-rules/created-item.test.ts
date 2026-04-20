import { describe, expect, it } from "vitest";

import { createdItemTarget } from "./created-item";
import { id } from "./_fixtures";

describe("createdItemTarget", () => {
  it("returns { kind: 'item', id } for the new item", () => {
    expect(createdItemTarget(id("new-1"))).toEqual({
      kind: "item",
      id: id("new-1"),
    });
  });
});
