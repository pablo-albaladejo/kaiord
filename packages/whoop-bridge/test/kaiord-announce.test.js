import { beforeEach, describe, expect, it } from "vitest";

const {
  buildAnnouncement,
  onDiscoverRequest,
  CAPABILITIES,
} = require("../kaiord-announce.js");

describe("kaiord-announce.js (whoop-bridge)", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should announce whoop-bridge identity with enum-valid capabilities", () => {
    // Arrange

    // Act
    const ann = buildAnnouncement();

    // Assert
    expect(ann).toMatchObject({
      type: "KAIORD_BRIDGE_ANNOUNCE",
      bridgeId: "whoop-bridge",
      name: "WHOOP",
      protocolVersion: 1,
      capabilities: ["read:body", "read:sleep"],
    });
  });

  it("should re-announce on a KAIORD_BRIDGE_DISCOVER from this window", () => {
    // Arrange
    const event = { source: window, data: { type: "KAIORD_BRIDGE_DISCOVER" } };

    // Act
    onDiscoverRequest(event);

    // Assert
    expect(window.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ bridgeId: "whoop-bridge" }),
      "https://kaiord.com"
    );
  });

  it("should expose only the frozen-enum capability tokens", () => {
    // Arrange

    // Act

    // Assert
    expect(CAPABILITIES).toEqual(["read:body", "read:sleep"]);
  });
});
