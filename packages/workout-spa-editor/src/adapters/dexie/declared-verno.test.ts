import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import { DECLARED_VERNO, KaiordDatabase } from "./dexie-database";

// Bump with each new schema version: the stale guard compares against it.
const HIGHEST_DECLARED = 37;

describe("DECLARED_VERNO", () => {
  it("should equal the highest version the code declares", () => {
    // Arrange
    const unopened = new KaiordDatabase("declared-verno-unopened");

    // Act
    const declared = unopened.verno;

    // Assert
    expect(DECLARED_VERNO).toBe(declared);
    expect(DECLARED_VERNO).toBe(HIGHEST_DECLARED);
  });
});
