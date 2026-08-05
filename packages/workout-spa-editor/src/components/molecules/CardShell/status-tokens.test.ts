import { describe, expect, it } from "vitest";

import type { ZoneNumber } from "../../../lib/zone-colors";
import { zoneBorderClass } from "./status-tokens";

const Z3: ZoneNumber = 3;
const Z4: ZoneNumber = 4;
const Z5: ZoneNumber = 5;
const ZONES: ZoneNumber[] = [1, 2, Z3, Z4, Z5];

describe("zoneBorderClass", () => {
  it.each(ZONES)("should map zone %s to its own left edge", (zone) => {
    // Arrange

    // Act
    const cls = zoneBorderClass(zone);

    // Assert
    expect(cls).toBe(`border-l-zone-${zone}`);
  });

  it("should leave a session with no calculable zone on the neutral edge", () => {
    // Arrange

    // Act
    const cls = zoneBorderClass(null);

    // Assert
    expect(cls).toBe("border-l-edge");
  });

  it("should never paint all four sides of the card", () => {
    // Arrange
    const all = [...ZONES.map(zoneBorderClass), zoneBorderClass(null)];

    // Act
    const wholeBorder = all.filter((cls) => !cls.startsWith("border-l-"));

    // Assert
    expect(wholeBorder).toEqual([]);
  });

  it("should keep every zone distinguishable from every other", () => {
    // Arrange
    const classes = ZONES.map(zoneBorderClass);

    // Act
    const unique = new Set(classes);

    // Assert
    expect(unique.size).toBe(ZONES.length);
  });
});
