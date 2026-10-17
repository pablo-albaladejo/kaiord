import { describe, expect, it } from "vitest";

import { PLACEMENT_FAILURE_REASONS } from "../application/garmin-placement/placement-result";
import en from "./locales/en/workout-detail.json";
import es from "./locales/es/workout-detail.json";

const CATALOGS = [
  ["en", en.placement.failed as Record<string, string>],
  ["es", es.placement.failed as Record<string, string>],
] as const;

const CASES = CATALOGS.flatMap(([locale, copy]) =>
  PLACEMENT_FAILURE_REASONS.map((reason) => [locale, reason, copy] as const)
);

describe("placement failure copy", () => {
  // A reason without copy would print its dotted key in PlacementFeedback.
  it.each(CASES)(
    "should have %s copy for placement.failed.%s",
    (_locale, reason, copy) => {
      // Arrange
      const key = reason;

      // Act
      const text = copy[key];

      // Assert
      expect(text).toEqual(expect.any(String));
      expect(text).not.toBe("");
    }
  );
});
