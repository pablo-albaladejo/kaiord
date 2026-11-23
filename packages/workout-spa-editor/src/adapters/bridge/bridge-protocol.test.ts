import { describe, expect, it } from "vitest";

import { isAcceptedBridgeProtocol } from "./bridge-protocol";

const NEXT_PROTOCOL = 3;

const BRIDGES = [
  "garmin-bridge",
  "tanita-bridge",
  "train2go-bridge",
  "trainingpeaks-bridge",
  "whoop-bridge",
];

describe("isAcceptedBridgeProtocol", () => {
  it.each(BRIDGES)(
    "should accept %s on the thin protocol and on the store version before it",
    (bridgeId) => {
      // Arrange
      const versions = [1, 2];

      // Act
      const accepted = versions.map((v) =>
        isAcceptedBridgeProtocol(bridgeId, v)
      );

      // Assert
      expect(accepted).toEqual([true, true]);
    }
  );

  it.each(BRIDGES)(
    "should refuse %s on a protocol the App does not know",
    (bridgeId) => {
      // Arrange
      const versions = [0, NEXT_PROTOCOL, "2", undefined];

      // Act
      const accepted = versions.map((v) =>
        isAcceptedBridgeProtocol(bridgeId, v)
      );

      // Assert
      expect(accepted).toEqual([false, false, false, false]);
    }
  );
});
