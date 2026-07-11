/**
 * Kaiord Bridge Core — envelope/dispatch unit tests (vendored)
 *
 * Master: packages/_shared/bridge-core/test/bridge-envelope.test.js.
 * Never edit a vendored copy — edit the master and run `pnpm bridge:sync`.
 */
import { describe, it, expect, vi } from "vitest";

const {
  isAllowedSenderOrigin,
  createEnvelope,
  createDispatch,
  createExternalDispatch,
} = require("../bridge-envelope.js");

describe("bridge-envelope (vendored)", () => {
  describe("isAllowedSenderOrigin", () => {
    it("should accept kaiord.com subdomains over https", () => {
      // Arrange
      const senders = [
        { origin: "https://app.kaiord.com" },
        { origin: "https://staging.kaiord.com" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual([true, true]);
    });

    it("should accept localhost dev ports 5173 and 5174", () => {
      // Arrange
      const senders = [
        { origin: "http://localhost:5173" },
        { origin: "http://localhost:5174" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual([true, true]);
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
      const senders = [
        { origin: "https://attacker.example" },
        { origin: "http://localhost:9999" },
        { origin: "http://app.kaiord.com" },
      ];

      // Act
      const allowed = senders.map(isAllowedSenderOrigin);

      // Assert
      expect(allowed).toEqual([false, false, false]);
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
      external(
        { action: "ping" },
        { origin: "https://app.kaiord.com" },
        respond
      );
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      // Assert
      expect(handleAction).toHaveBeenCalledWith({ action: "ping" });
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ ok: true })
      );
    });

    it("should reject a foreign origin without invoking the handler", () => {
      // Arrange
      const { handleAction, external } = setup();
      const respond = vi.fn();

      // Act
      const returns = external(
        { action: "ping" },
        { origin: "https://attacker.example" },
        respond
      );

      // Assert
      expect(returns).toBe(true);
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Origin or action not permitted",
        retryable: false,
      });
    });

    it("should reject an empty sender without invoking the handler", () => {
      // Arrange
      const { handleAction, external } = setup();
      const respond = vi.fn();

      // Act
      external({ action: "ping" }, {}, respond);

      // Assert
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false })
      );
    });

    it("should reject actions outside the allowlist even from an allowed origin", () => {
      // Arrange
      const { handleAction, external } = setup();
      const respond = vi.fn();

      // Act
      external(
        { action: "set-credentials" },
        { origin: "https://app.kaiord.com" },
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
});
