// Kaiord Bridge Core — vendored unit tests for kaiord-announce.js.
// Master: packages/_shared/bridge-core/test/kaiord-announce.test.js. Never
// edit a vendored copy — edit the master and run `pnpm bridge:sync`. Every
// bridge runs this suite against its own announce copy and its own identity
// file; the identity values themselves are pinned to BRIDGE_MANIFEST by
// scripts/check-bridge-core-parity.test.mjs, so they are read, not repeated.
import { beforeEach, describe, expect, it } from "vitest";

// The identity file provides globalThis.KAIORD_BRIDGE_IDENTITY, which the
// announce core reads (the manifest loads it first for the same reason).
require("../bridge-identity.js");
const {
  buildAnnouncement,
  onDiscoverRequest,
  announce,
  isContextValid,
} = require("../kaiord-announce.js");

const identity = globalThis.KAIORD_BRIDGE_IDENTITY;
const SPA_ORIGIN = "https://kaiord.com";
const CAPABILITY_SHAPE = /^(read|write):[a-z-]+$/;

describe("kaiord-announce (vendored)", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("bridge identity", () => {
    it("should load a complete identity before the announce core", () => {
      // Arrange
      const { id, name, capabilities } = identity ?? {};

      // Act
      const capabilityShapes = (capabilities ?? []).map((c) =>
        CAPABILITY_SHAPE.test(c)
      );

      // Assert
      expect(id).toMatch(/^[a-z0-9]+-bridge$/);
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
      expect(capabilities.length).toBeGreaterThan(0);
      expect(capabilityShapes.every(Boolean)).toBe(true);
    });
  });

  describe("buildAnnouncement", () => {
    it("should return a well-formed announcement carrying the bridge identity", () => {
      // Arrange

      // Act
      const ann = buildAnnouncement();

      // Assert
      expect(ann).toEqual({
        type: "KAIORD_BRIDGE_ANNOUNCE",
        bridgeId: identity.id,
        extensionId: "test-extension-id",
        name: identity.name,
        version: "0.0.0",
        protocolVersion: 1,
        capabilities: identity.capabilities,
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
      const event = {
        source: window,
        data: { type: "KAIORD_BRIDGE_DISCOVER" },
      };

      // Act
      onDiscoverRequest(event);

      // Assert
      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "KAIORD_BRIDGE_ANNOUNCE",
          bridgeId: identity.id,
        }),
        SPA_ORIGIN
      );
    });

    it("should ignore messages from other sources", () => {
      // Arrange
      const event = {
        source: { fake: true },
        data: { type: "KAIORD_BRIDGE_DISCOVER" },
      };

      // Act
      onDiscoverRequest(event);

      // Assert
      expect(window.postMessage).not.toHaveBeenCalled();
    });

    it("should ignore unrelated message types", () => {
      // Arrange
      const event = { source: window, data: { type: "SOMETHING_ELSE" } };

      // Act
      onDiscoverRequest(event);

      // Assert
      expect(window.postMessage).not.toHaveBeenCalled();
    });

    it("should ignore events without data", () => {
      // Arrange
      const event = { source: window };

      // Act
      onDiscoverRequest(event);

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
          bridgeId: identity.id,
        }),
        SPA_ORIGIN
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
