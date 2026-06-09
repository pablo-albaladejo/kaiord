import { describe, expect, it } from "vitest";

import { buildCoachingDraftKrd } from "./build-coaching-draft-krd";
import { stubActivity } from "./convert-coaching-activity-with-ai.test-helpers";

describe("buildCoachingDraftKrd", () => {
  it("should resolve a known sport and return a seeded template KRD", () => {
    // Arrange
    const activity = stubActivity({ sport: "cycling" });

    // Act
    const draft = buildCoachingDraftKrd(activity);

    // Assert
    expect(draft?.sport).toBe("cycling");
    expect(draft?.krd.metadata.sport).toBe("cycling");
  });

  it("should map a Train2Go sport to its KRD sport and subSport", () => {
    // Arrange
    const activity = stubActivity({ sport: "stretching" });

    // Act
    const draft = buildCoachingDraftKrd(activity);

    // Assert
    expect(draft?.sport).toBe("training");
    expect(draft?.subSport).toBe("flexibility_training");
  });

  it("should return null for a rest day (no trainable workout)", () => {
    // Arrange
    const activity = stubActivity({ sport: "rest" });

    // Act
    const draft = buildCoachingDraftKrd(activity);

    // Assert
    expect(draft).toBeNull();
  });
});
