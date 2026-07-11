import { beforeEach, describe, expect, it } from "vitest";

// The identity file provides globalThis.KAIORD_BRIDGE_IDENTITY, which the
// vendored announce core reads (manifest loads it first for the same reason).
require("../bridge-identity.js");
const {
  buildAnnouncement,
  onDiscoverRequest,
  announce,
  isContextValid,
} = require("../kaiord-announce.js");

describe("kaiord-announce.js (whoop-bridge)", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("buildAnnouncement", () => {
    it("should return a well-formed announcement with bridge metadata", () => {
      // Arrange

      // Act
      const ann = buildAnnouncement();

      // Assert
      expect(ann).toEqual({
        type: "KAIORD_BRIDGE_ANNOUNCE",
        bridgeId: "whoop-bridge",
        extensionId: "test-extension-id",
        name: "WHOOP",
        version: "0.0.0",
        protocolVersion: 1,
        capabilities: ["read:body", "read:sleep"],
      });
    });

    it("should use chrome.runtime.id for the extension identifier", () => {
      // Arrange
      chrome.runtime.id = "another-id";

      // Act
      const ann = buildAnnouncement();

      // Assert
      expect(ann.extensionId).toBe("another-id");
      chrome.runtime.id = "test-extension-id";
    });
  });

  describe("onDiscoverRequest", () => {
    it("should re-announce when a KAIORD_BRIDGE_DISCOVER from window arrives", () => {
      // Arrange

      // Act
      onDiscoverRequest({
        source: window,
        data: { type: "KAIORD_BRIDGE_DISCOVER" },
      });

      // Assert
      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "KAIORD_BRIDGE_ANNOUNCE",
          bridgeId: "whoop-bridge",
        }),
        "https://kaiord.com"
      );
    });

    it("should ignore messages from other sources", () => {
      // Arrange

      // Act
      onDiscoverRequest({
        source: { fake: true },
        data: { type: "KAIORD_BRIDGE_DISCOVER" },
      });

      // Assert
      expect(window.postMessage).not.toHaveBeenCalled();
    });

    it("should ignore unrelated message types and missing data", () => {
      // Arrange

      // Act
      onDiscoverRequest({ source: window, data: { type: "SOMETHING_ELSE" } });
      onDiscoverRequest({ source: window });

      // Assert
      expect(window.postMessage).not.toHaveBeenCalled();
    });
  });

  describe("announce", () => {
    it("should post the announcement to the current origin", () => {
      // Arrange

      // Act
      announce();

      // Assert
      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "KAIORD_BRIDGE_ANNOUNCE",
          bridgeId: "whoop-bridge",
        }),
        "https://kaiord.com"
      );
    });

    it("should self-detach and bail when the extension context is invalidated", () => {
      // Arrange
      const originalId = chrome.runtime.id;
      Object.defineProperty(chrome.runtime, "id", { value: undefined });

      // Act
      announce();

      // Assert
      expect(window.postMessage).not.toHaveBeenCalled();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "message",
        onDiscoverRequest
      );
      Object.defineProperty(chrome.runtime, "id", { value: originalId });
    });
  });

  describe("isContextValid", () => {
    it("should return true while chrome.runtime.id is set", () => {
      // Arrange

      // Act
      const valid = isContextValid();

      // Assert
      expect(valid).toBe(true);
    });

    it("should return false when chrome.runtime.id is undefined", () => {
      // Arrange
      const originalId = chrome.runtime.id;
      Object.defineProperty(chrome.runtime, "id", { value: undefined });

      // Act
      const valid = isContextValid();

      // Assert
      expect(valid).toBe(false);
      Object.defineProperty(chrome.runtime, "id", { value: originalId });
    });
  });
});
