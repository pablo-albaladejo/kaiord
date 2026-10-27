import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { DECLARED_VERNO, KaiordDatabase } from "./dexie-database";

describe("DECLARED_VERNO", () => {
  it("should equal the highest version the code declares", () => {
    // Arrange
    const unopened = new KaiordDatabase("declared-verno-unopened");

    // Act
    const declared = unopened.verno;

    // Assert
    expect(DECLARED_VERNO).toBe(declared);
    expect(Number.isInteger(DECLARED_VERNO)).toBe(true);
    expect(DECLARED_VERNO).toBeGreaterThan(0);
  });
});
