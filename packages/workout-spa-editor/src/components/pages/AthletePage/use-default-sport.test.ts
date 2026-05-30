import { describe, expect, it } from "vitest";

import { profileWith } from "../../../lib/athlete/test-profile";
import { defaultSport } from "./use-default-sport";

const RUN_PACE = 300;

describe("defaultSport", () => {
  it("should pick the first sport with a derivable zone map", () => {
    // Arrange
    const profile = profileWith("running", { thresholdPace: RUN_PACE });

    // Act
    const sport = defaultSport(profile);

    // Assert
    expect(sport).toBe("running");
  });

  it("should default to cycling when no sport has a zone map", () => {
    // Arrange
    const profile = profileWith("cycling", {});

    // Act
    const sport = defaultSport(profile);

    // Assert
    expect(sport).toBe("cycling");
  });
});
