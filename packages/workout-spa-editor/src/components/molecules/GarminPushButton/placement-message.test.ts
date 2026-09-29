import { describe, expect, it } from "vitest";

import {
  failed,
  type PlacementResult,
} from "../../../application/garmin-placement/placement-result";
import { placementMessage } from "./placement-message";

const DATE = "2026-10-05";
const OTHER = "2026-10-04";

describe("placementMessage", () => {
  it.each<[string, PlacementResult, object]>([
    ["scheduled", { kind: "scheduled" }, { tone: "plain", date: DATE }],
    ["moved", { kind: "moved" }, { tone: "plain", date: DATE }],
    ["unchanged", { kind: "unchanged" }, { tone: "plain", date: DATE }],
    [
      "duplicate-left",
      { kind: "duplicate-left", dates: [OTHER] },
      { tone: "warning", key: "placement.duplicateLeft", dates: [OTHER] },
    ],
    [
      "uncertain",
      { kind: "uncertain", date: OTHER, canConfirm: true },
      { tone: "warning", key: "placement.uncertain", date: OTHER },
    ],
    [
      "library-only",
      { kind: "library-only", reason: "bridge-outdated" },
      { tone: "warning", key: "placement.libraryOnly.bridge-outdated" },
    ],
    [
      "failed",
      failed("needs-reauth", false),
      { tone: "danger", key: "placement.failed.needs-reauth" },
    ],
  ])("should word a %s result", (_name, result, expected) => {
    // Arrange
    const date = DATE;

    // Act
    const message = placementMessage(result, date);

    // Assert
    expect(message).toMatchObject(expected);
  });

  it("should never word a warning-level result as danger", () => {
    // Arrange
    const results: PlacementResult[] = [
      { kind: "duplicate-left", dates: [OTHER] },
      { kind: "uncertain", date: DATE, canConfirm: false },
      { kind: "library-only", reason: "insecure-context" },
    ];

    // Act
    const tones = results.map((r) => placementMessage(r, DATE).tone);

    // Assert
    expect(tones).toEqual(["warning", "warning", "warning"]);
  });
});
