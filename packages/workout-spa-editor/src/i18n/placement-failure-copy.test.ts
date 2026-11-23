import { connectionNotice } from "@kaiord/i18n";
import { describe, expect, it } from "vitest";

import {
  PLACEMENT_FAILURE_REASONS,
  type PlacementResult,
} from "../application/garmin-placement/placement-result";
import { placementConnection } from "../components/molecules/GarminPushButton/placement-message";
import en from "./locales/en/workout-detail.json";
import es from "./locales/es/workout-detail.json";

const CATALOGS = [
  ["en", en.placement.failed as Record<string, string>],
  ["es", es.placement.failed as Record<string, string>],
] as const;

const failed = (reason: string) =>
  ({ kind: "failed", reason }) as unknown as PlacementResult;

const CASES = CATALOGS.flatMap(([locale, copy]) =>
  PLACEMENT_FAILURE_REASONS.map((reason) => [locale, reason, copy] as const)
);

describe("placement failure copy", () => {
  // A reason without copy would print its dotted key in PlacementFeedback; a
  // reason the Garmin Connection caused is its notice, worded once elsewhere.
  it.each(CASES)(
    "should word %s placement.failed.%s exactly once",
    (locale, reason, copy) => {
      // Arrange
      const connection = placementConnection(failed(reason));

      // Act
      const text = copy[reason];
      const notice =
        connection === null
          ? null
          : connectionNotice(connection, "Garmin", locale);

      // Assert
      if (connection === null) {
        expect(text).toEqual(expect.any(String));
        expect(text).not.toBe("");
      } else {
        expect(text).toBeUndefined();
        expect(notice?.message).toEqual(expect.any(String));
      }
    }
  );
});
