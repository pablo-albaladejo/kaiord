import { afterEach, describe, expect, it, vi } from "vitest";

import { SESSION_PROBES } from "./bridge-session-probes";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

describe("SESSION_PROBES", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // What each check costs an extension one protocol behind, and that such
  // an extension is then asked nothing, is bridge-session-check-cost.test.ts.
  it("should expose a prober for every extension", () => {
    // Arrange
    const expected = [
      "garmin-bridge",
      "tanita-bridge",
      "train2go-bridge",
      "whoop-bridge",
      "trainingpeaks-bridge",
    ];

    // Act
    const keys = Object.keys(SESSION_PROBES);

    // Assert
    expect(keys.sort()).toEqual(expected.sort());
  });
});
