import { describe, expect, it } from "vitest";

import { asItemId } from "../providers/item-id";
import type { FocusTarget } from "./focus-target.types";

describe("FocusTarget discriminated union", () => {
  it("narrows to { id } on kind === 'item'", () => {
    const target: FocusTarget = { kind: "item", id: asItemId("abc") };

    if (target.kind === "item") {
      expect(target.id).toBe("abc");
    } else {
      throw new Error("expected item narrowing");
    }
  });

  it("narrows to empty-state without id", () => {
    const target: FocusTarget = { kind: "empty-state" };

    if (target.kind === "empty-state") {
      expect("id" in target).toBe(false);
    } else {
      throw new Error("expected empty-state narrowing");
    }
  });
});
