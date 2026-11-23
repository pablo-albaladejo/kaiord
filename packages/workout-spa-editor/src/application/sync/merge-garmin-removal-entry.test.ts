import { describe, expect, it } from "vitest";

import type { GarminRemovalEntry } from "../../types/garmin-removal-entry";
import { isKaiords, joinEntries } from "./merge-garmin-removal-entry";

const base = {
  workoutScheduleId: "100",
  workoutId: "1707805999",
  date: "2026-10-06",
  attempts: 0,
  abandoned: false,
} as GarminRemovalEntry;

const POOL: GarminRemovalEntry[] = [
  { ...base, state: "keep" },
  { ...base, state: "keep", recognized: true },
  { ...base, state: "keep", created: true },
  { ...base, state: "retire", attempts: 2 },
  { ...base, state: "retire", recognized: true, noticed: true },
  { ...base, state: "gone" },
  { ...base, state: "gone", deleted: true },
  { ...base, state: "keep", revival: 1 },
  { ...base, state: "retire", revival: 1, attempts: 1 },
  { ...base, state: "gone", revival: 2, deleted: true },
];

const same = (x: unknown, y: unknown) =>
  JSON.stringify(x) === JSON.stringify(y);

describe("joining two states of one removal entry", () => {
  it("should be commutative, associative and idempotent", () => {
    // Arrange
    const broken: string[] = [];

    // Act
    for (const x of POOL) {
      if (!same(joinEntries(x, x), joinEntries(joinEntries(x, x), x)))
        broken.push("idempotence");
      for (const y of POOL) {
        if (!same(joinEntries(x, y), joinEntries(y, x)))
          broken.push("commutativity");
        for (const z of POOL)
          if (
            !same(
              joinEntries(joinEntries(x, y), z),
              joinEntries(x, joinEntries(y, z))
            )
          )
            broken.push("associativity");
      }
    }

    // Assert
    expect([...new Set(broken)]).toEqual([]);
  });

  it("should keep an entry recognized on one device and created on another as Kaiord's", () => {
    // Arrange
    const recognized: GarminRemovalEntry = {
      ...base,
      state: "keep",
      recognized: true,
    };
    const created: GarminRemovalEntry = {
      ...base,
      state: "retire",
      created: true,
    };

    // Act
    const joined = joinEntries(recognized, created);

    // Assert
    expect(joined).toMatchObject({ state: "retire", recognized: true });
    expect(isKaiords(joined)).toBe(true);
  });

  it("should never let a merge make a recognized entry deletable", () => {
    // Arrange
    const recognized: GarminRemovalEntry = {
      ...base,
      state: "keep",
      recognized: true,
    };
    const superseded: GarminRemovalEntry = { ...base, state: "retire" };

    // Act
    const joined = joinEntries(recognized, superseded);

    // Assert
    expect(joined.state).toBe("retire");
    expect(isKaiords(joined)).toBe(false);
  });

  it("should let a revival outrank a gone entry and carry its own attempts", () => {
    // Arrange
    const gone: GarminRemovalEntry = {
      ...base,
      state: "gone",
      attempts: 2,
      abandoned: true,
    };
    const revived: GarminRemovalEntry = {
      ...base,
      state: "retire",
      revival: 1,
    };

    // Act
    const joined = joinEntries(gone, revived);

    // Assert
    expect(joined).toEqual({ ...base, state: "retire", revival: 1 });
  });

  it("should keep an entry another device saw deleted gone, whatever revival it meets", () => {
    // Arrange
    const deleted: GarminRemovalEntry = {
      ...base,
      state: "gone",
      created: true,
      deleted: true,
    };
    const revived: GarminRemovalEntry = { ...base, state: "keep", revival: 1 };

    // Act
    const joined = joinEntries(revived, deleted);

    // Assert
    expect(joined).toMatchObject({ state: "gone", deleted: true });
    expect(joinEntries(deleted, revived)).toEqual(joined);
  });
});
