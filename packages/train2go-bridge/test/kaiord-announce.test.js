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

describe("kaiord-announce.js (train2go-bridge)", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("buildAnnouncement", () => {
    it("returns a well-formed announcement with bridge metadata", () => {
      const ann = buildAnnouncement();

      expect(ann).toEqual({
        type: "KAIORD_BRIDGE_ANNOUNCE",
        bridgeId: "train2go-bridge",
        extensionId: "test-extension-id",
        name: "Kaiord Train2Go Bridge",
        version: "0.0.0",
        protocolVersion: 1,
        capabilities: ["read:training-plan", "read:training-zones"],
      });
    });
  });

  describe("onDiscoverRequest", () => {
    it("re-announces when a KAIORD_BRIDGE_DISCOVER from window arrives", () => {
      onDiscoverRequest({
        source: window,
        data: { type: "KAIORD_BRIDGE_DISCOVER" },
      });

      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "KAIORD_BRIDGE_ANNOUNCE",
          bridgeId: "train2go-bridge",
        }),
        "https://kaiord.com"
      );
    });

    it("ignores messages from other sources", () => {
      onDiscoverRequest({
        source: { fake: true },
        data: { type: "KAIORD_BRIDGE_DISCOVER" },
      });

      expect(window.postMessage).not.toHaveBeenCalled();
    });

    it("ignores unrelated message types", () => {
      onDiscoverRequest({
        source: window,
        data: { type: "SOMETHING_ELSE" },
      });

      expect(window.postMessage).not.toHaveBeenCalled();
    });
  });

  describe("announce", () => {
    it("posts the announcement to the current origin", () => {
      announce();

      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "KAIORD_BRIDGE_ANNOUNCE",
          bridgeId: "train2go-bridge",
        }),
        "https://kaiord.com"
      );
    });

    it("self-detaches and bails when the extension context is invalidated", () => {
      const originalId = chrome.runtime.id;
      // Simulate the post-reload state: chrome.runtime.id is undefined.
      Object.defineProperty(chrome.runtime, "id", { value: undefined });

      announce();

      expect(window.postMessage).not.toHaveBeenCalled();
      expect(window.removeEventListener).toHaveBeenCalledWith(
        "message",
        onDiscoverRequest
      );

      Object.defineProperty(chrome.runtime, "id", { value: originalId });
    });
  });

  describe("isContextValid", () => {
    it("returns true while chrome.runtime.id is set", () => {
      expect(isContextValid()).toBe(true);
    });

    it("returns false when chrome.runtime.id is undefined", () => {
      const originalId = chrome.runtime.id;
      Object.defineProperty(chrome.runtime, "id", { value: undefined });

      expect(isContextValid()).toBe(false);

      Object.defineProperty(chrome.runtime, "id", { value: originalId });
    });
  });
});
