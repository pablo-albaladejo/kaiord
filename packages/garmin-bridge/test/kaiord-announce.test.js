import { beforeEach, describe, expect, it } from "vitest";

const { buildAnnouncement, onDiscoverRequest, announce } =
  require("../kaiord-announce.js");

describe("kaiord-announce.js (garmin-bridge)", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("buildAnnouncement", () => {
    it("returns a well-formed announcement with bridge metadata", () => {
      const ann = buildAnnouncement();

      expect(ann).toEqual({
        type: "KAIORD_BRIDGE_ANNOUNCE",
        bridgeId: "garmin-bridge",
        extensionId: "garmin-test-extension-id",
        name: "Garmin Connect",
        version: "0.2.0",
        protocolVersion: 1,
        capabilities: ["write:workouts"],
      });
    });

    it("uses chrome.runtime.id for the extension identifier", () => {
      chrome.runtime.id = "another-id";

      const ann = buildAnnouncement();

      expect(ann.extensionId).toBe("another-id");

      chrome.runtime.id = "garmin-test-extension-id";
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
          bridgeId: "garmin-bridge",
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

    it("ignores events without data", () => {
      onDiscoverRequest({ source: window });

      expect(window.postMessage).not.toHaveBeenCalled();
    });
  });

  describe("announce", () => {
    it("posts the announcement to the current origin", () => {
      announce();

      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "KAIORD_BRIDGE_ANNOUNCE",
          bridgeId: "garmin-bridge",
        }),
        "https://kaiord.com"
      );
    });
  });
});
