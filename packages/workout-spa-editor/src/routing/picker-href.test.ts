import { describe, expect, it } from "vitest";

import { buildPickerHref } from "./picker-href";

describe("buildPickerHref", () => {
  it('should return "/workout/new" when date is null', () => {
    // Arrange
    const date = null;

    // Act
    const result = buildPickerHref(date);

    // Assert
    expect(result).toBe("/workout/new");
  });

  it('should return "/workout/new?date=Y-M-D" when date is a valid ISO string', () => {
    // Arrange
    const date = "2026-06-01";

    // Act
    const result = buildPickerHref(date);

    // Assert
    expect(result).toBe("/workout/new?date=2026-06-01");
  });
});
