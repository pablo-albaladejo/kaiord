import { describe, expect, it } from "vitest";

import { asItemId, type ItemId } from "./item-id";

describe("ItemId branded type", () => {
  it("asItemId brands a plain string", () => {
    const id = asItemId("abc");

    expect(typeof id).toBe("string");
    expect(id).toBe("abc");
  });

  it("prevents plain-string assignment without asItemId cast", () => {
    const plain: string = "raw-positional-id";

    // @ts-expect-error: plain string cannot be assigned to branded ItemId
    const notAllowed: ItemId = plain;

    // Sanity: the cast helper is the only supported path.
    const allowed: ItemId = asItemId(plain);

    expect(notAllowed).toBe("raw-positional-id");
    expect(allowed).toBe("raw-positional-id");
  });
});
