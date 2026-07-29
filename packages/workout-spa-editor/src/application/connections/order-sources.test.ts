import { describe, expect, it } from "vitest";

import { orderSources } from "./order-sources";

describe("orderSources", () => {
  it("should drop stale saved sources and keep only live ones", () => {
    // Arrange

    // Act
    const order = orderSources(["a", "b"], ["c", "b", "a"]);

    // Assert
    expect(order).toEqual(["b", "a"]);
  });

  it("should append a live source the saved ranking never mentioned", () => {
    // Arrange

    // Act
    const order = orderSources(["a", "b"], ["b"]);

    // Assert
    expect(order).toEqual(["b", "a"]);
  });
});
