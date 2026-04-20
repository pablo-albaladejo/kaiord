import { beforeEach, describe, expect, it } from "vitest";

const {
  buildAnnouncement,
  onDiscoverRequest,
  announce,
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
        extensionId: "train2go-test-extension-id",
        name: "Train2Go",
        version: "0.1.1",
        protocolVersion: 1,
        capabilities: ["read:training-plan"],
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
  });
});
