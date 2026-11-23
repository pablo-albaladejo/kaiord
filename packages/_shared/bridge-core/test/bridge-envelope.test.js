/**
 * Kaiord Bridge Core — envelope/dispatch unit tests (vendored)
 *
 * Master: packages/_shared/bridge-core/test/bridge-envelope.test.js.
 * Never edit a vendored copy — edit the master and run `pnpm bridge:sync`.
 */
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  isAllowedSenderOrigin,
  createEnvelope,
  createDispatch,
  createExternalDispatch,
  createInternalDispatch,
} = require("../bridge-envelope.js");

describe("bridge-envelope (vendored)", () => {
  describe("isAllowedSenderOrigin", () => {
    const withManifestMatches = (matches) =>
      chrome.runtime.getManifest.mockReturnValue({
        version: "0.0.0",
        externally_connectable: { matches },
      });

    beforeEach(() => {
      __resetChromeMock();
      chrome.runtime.getManifest.mockReturnValue({ version: "0.0.0" });
    });

    it("should accept the exact Kaiord App origin", () => {
      // Arrange
      const sender = { origin: "https://kaiord.com" };

      // Act
      const allowed = isAllowedSenderOrigin(sender);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should accept the origin the popup opens the editor at", () => {
      // Arrange
      const popupSource = readFileSync(
        new URL("../popup.js", import.meta.url),
        "utf8"
      );
      const [, editorUrl] = popupSource.match(
        /const OPEN_EDITOR_URL = "([^"]+)";/
      );

      // Act
      const allowed = isAllowedSenderOrigin({
        origin: new URL(editorUrl).origin,
      });

      // Assert
      expect(allowed).toBe(true);
    });

    it("should reject every kaiord.com subdomain, www included", () => {
      // Arrange
      const senders = [
        { origin: "https://www.kaiord.com" },
        { origin: "https://app.kaiord.com" },
        { origin: "https://staging.kaiord.com" },
        { origin: "https://a.b.kaiord.com" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual(senders.map(() => false));
    });

    it("should accept localhost dev ports 5173 and 5174 when the loaded manifest declares them", () => {
      // Arrange
      withManifestMatches([
        "http://localhost:5173/*",
        "http://localhost:5174/*",
        "https://kaiord.com/*",
      ]);
      const senders = [
        { origin: "http://localhost:5173" },
        { origin: "http://localhost:5174" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual([true, true]);
    });

    it("should reject localhost dev ports when the loaded manifest is the production one", () => {
      // Arrange
      withManifestMatches(["https://kaiord.com/*"]);
      const senders = [
        { origin: "http://localhost:5173" },
        { origin: "http://localhost:5174" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual([false, false]);
    });

    it("should reject a missing or undefined origin", () => {
      // Arrange
      const senders = [{}, undefined];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual([false, false]);
    });

    it("should reject foreign origins and other localhost ports", () => {
      // Arrange
      withManifestMatches([
        "http://localhost:5173/*",
        "http://localhost:5174/*",
        "https://kaiord.com/*",
      ]);
      const senders = [
        { origin: "https://attacker.example" },
        { origin: "http://localhost:9999" },
        { origin: "http://app.kaiord.com" },
        { origin: "https://evil.com" },
        { origin: "https://xkaiord.com" },
        { origin: "https://kaiord.com.evil.com" },
        { origin: "http://kaiord.com" },
        { origin: "https://kaiord.com:8443" },
        { origin: "https://KAIORD.com" },
        { origin: "https://kaiord.com/" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual(senders.map(() => false));
    });
  });

  describe("createEnvelope", () => {
    it("should wrap success results with the protocol version", () => {
      // Arrange
      const { sendResult } = createEnvelope(1);
      const respond = vi.fn();

      // Act
      sendResult({ hello: true }, respond);

      // Assert
      expect(respond).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: { hello: true },
      });
    });

    it("should serialize error fields, keeping optional markers only when set", () => {
      // Arrange
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();
      const err = new Error("boom");
      err.status = 429;
      err.retryable = true;
      err.resetSeconds = 30;

      // Act
      sendError(err, respond);

      // Assert
      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "boom",
        status: 429,
        retryable: true,
        resetSeconds: 30,
      });
    });

    it("should omit optional error fields when absent", () => {
      // Arrange
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();

      // Act
      sendError(new Error("plain"), respond);

      // Assert
      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "plain",
      });
    });

    it("should carry retryable: false explicitly when the thrower sets it", () => {
      // Arrange
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();
      const err = new Error("no retry");
      err.retryable = false;

      // Act
      sendError(err, respond);

      // Assert
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ retryable: false })
      );
    });

    it("should mark reauth conditions", () => {
      // Arrange
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();
      const err = new Error("expired");
      err.needsReauth = true;

      // Act
      sendError(err, respond);

      // Assert
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ needsReauth: true })
      );
    });
  });

  describe("createDispatch", () => {
    it("should resolve the action handler into a success envelope", async () => {
      // Arrange
      const dispatch = createDispatch({
        handleAction: vi.fn().mockResolvedValue({ pong: true }),
        protocolVersion: 1,
      });
      const respond = vi.fn();

      // Act
      const returns = dispatch({ action: "ping" }, respond);
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      // Assert
      expect(returns).toBe(true);
      expect(respond).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: { pong: true },
      });
    });

    it("should route handler rejections through the error envelope", async () => {
      // Arrange
      const dispatch = createDispatch({
        handleAction: vi.fn().mockRejectedValue(new Error("nope")),
        protocolVersion: 1,
      });
      const respond = vi.fn();

      // Act
      dispatch({ action: "ping" }, respond);
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      // Assert
      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "nope",
      });
    });
  });

  describe("createExternalDispatch", () => {
    const setup = () => {
      const handleAction = vi.fn().mockResolvedValue(null);
      const dispatch = createDispatch({ handleAction, protocolVersion: 1 });
      const external = createExternalDispatch({
        dispatch,
        externalActions: new Set(["ping"]),
        protocolVersion: 1,
      });
      return { handleAction, external };
    };

    it("should dispatch allowlisted actions from an allowed origin", async () => {
      // Arrange
      const { handleAction, external } = setup();
      const respond = vi.fn();

      // Act
      external({ action: "ping" }, { origin: "https://kaiord.com" }, respond);
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      // Assert
      expect(handleAction).toHaveBeenCalledWith({ action: "ping" });
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ ok: true })
      );
    });

    it.each([
      {
        label: "a foreign origin",
        sender: { origin: "https://attacker.example" },
      },
      {
        label: "a kaiord.com subdomain",
        sender: { origin: "https://app.kaiord.com" },
      },
      { label: "the www host", sender: { origin: "https://www.kaiord.com" } },
      { label: "an empty sender", sender: {} },
    ])("should give no answer to $label", ({ sender }) => {
      // Arrange
      const { handleAction, external } = setup();
      const respond = vi.fn();

      // Act
      const keepsChannelOpen = external({ action: "ping" }, sender, respond);

      // Assert
      expect(keepsChannelOpen).toBe(false);
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).not.toHaveBeenCalled();
    });

    it("should reject actions outside the allowlist even from an allowed origin", () => {
      // Arrange
      const { handleAction, external } = setup();
      const respond = vi.fn();

      // Act
      external(
        { action: "set-credentials" },
        { origin: "https://kaiord.com" },
        respond
      );

      // Assert
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });
  });
  describe("createInternalDispatch", () => {
    const ID = "test-extension-id";
    const popup = { id: ID, origin: `chrome-extension://${ID}` };
    const setup = () => {
      const handleAction = vi.fn().mockResolvedValue(null);
      const dispatch = createDispatch({ handleAction, protocolVersion: 1 });
      const internal = createInternalDispatch({
        dispatch,
        internalActions: new Set(["ping"]),
        protocolVersion: 1,
      });
      return { handleAction, internal };
    };

    it("should dispatch an internal action from the extension's own page", async () => {
      // Arrange
      const { handleAction, internal } = setup();
      const respond = vi.fn();

      // Act
      internal({ action: "ping" }, popup, respond);
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      // Assert
      expect(handleAction).toHaveBeenCalledWith({ action: "ping" });
    });

    it.each([
      {
        label: "a content script in a web page",
        sender: { id: ID, origin: "https://kaiord.com", tab: { id: 1 } },
      },
      {
        label: "an extension page opened in a tab",
        sender: { ...popup, tab: { id: 1 } },
      },
      {
        label: "another extension",
        sender: { id: "other", origin: "chrome-extension://other" },
      },
      { label: "an empty sender", sender: {} },
    ])("should give no answer to $label", ({ sender }) => {
      // Arrange
      const { handleAction, internal } = setup();
      const respond = vi.fn();

      // Act
      const keepsChannelOpen = internal({ action: "ping" }, sender, respond);

      // Assert
      expect(keepsChannelOpen).toBe(false);
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).not.toHaveBeenCalled();
    });

    it("should refuse an action outside the internal allowlist", () => {
      // Arrange
      const { handleAction, internal } = setup();
      const respond = vi.fn();

      // Act
      internal({ action: "request" }, popup, respond);

      // Assert
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false, retryable: false })
      );
    });
  });
});
