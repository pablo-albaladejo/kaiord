import { afterEach, describe, expect, it, vi } from "vitest";

import { SESSION_PROBES } from "./bridge-session-probes";

vi.mock("./bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

describe("SESSION_PROBES", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should expose a prober for every cheaply-probeable bridge", () => {
    // Arrange
    const expected = [
      "garmin-bridge",
      "train2go-bridge",
      "whoop-bridge",
      "trainingpeaks-bridge",
    ];

    // Act
    const keys = Object.keys(SESSION_PROBES);

    // Assert
    expect(keys.sort()).toEqual(expected.sort());
  });

  it("should not expose a prober for tanita-bridge", () => {
    // Arrange
    const bridgeId = "tanita-bridge";

    // Act
    const prober = SESSION_PROBES[bridgeId];

    // Assert
    // tanita's checkSession downloads the whole export CSV — polling it would
    // re-fetch the user's entire history every pass.
    expect(prober).toBeUndefined();
  });
});
