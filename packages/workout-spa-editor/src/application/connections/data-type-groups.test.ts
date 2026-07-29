import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { DATA_TYPE_GROUPS } from "./data-type-groups";

const grouped = DATA_TYPE_GROUPS.flatMap((group) => group.types);

describe("data-type groups", () => {
  it("should place every managed data type in exactly one group", () => {
    // Arrange
    // Training / Recovery / Body exists only here. `managedDataTypes` is a
    // flat list in @kaiord/core, and three types (strain, vitals,
    // heart-rate-series) were already appended to it in one PR — a fourth
    // would otherwise render in no group and vanish from the page silently.
    const expected = [...managedDataTypes].sort();

    // Act
    const actual = [...grouped].sort();

    // Assert
    expect(actual).toEqual(expected);
  });

  it("should not keep a type the domain no longer manages", () => {
    // Arrange
    // The other direction of the same drift: a type renamed or removed in
    // core leaves a group entry that resolves to no row, so the group renders
    // one item short with nothing failing.
    const managed = new Set<string>(managedDataTypes);

    // Act
    const stale = grouped.filter((dataType) => !managed.has(dataType));

    // Assert
    expect(stale).toEqual([]);
  });
});
