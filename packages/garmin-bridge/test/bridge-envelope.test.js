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
    it("accepts kaiord.com subdomains over https", () => {
      expect(isAllowedSenderOrigin({ origin: "https://app.kaiord.com" })).toBe(
        true
      );
      expect(
        isAllowedSenderOrigin({ origin: "https://staging.kaiord.com" })
      ).toBe(true);
    });

    it("accepts localhost dev ports 5173 and 5174", () => {
      expect(isAllowedSenderOrigin({ origin: "http://localhost:5173" })).toBe(
        true
      );
      expect(isAllowedSenderOrigin({ origin: "http://localhost:5174" })).toBe(
        true
      );
    });

    it("rejects a missing or undefined origin", () => {
      expect(isAllowedSenderOrigin({})).toBe(false);
      expect(isAllowedSenderOrigin(undefined)).toBe(false);
    });

    it("rejects foreign origins and other localhost ports", () => {
      expect(
        isAllowedSenderOrigin({ origin: "https://attacker.example" })
      ).toBe(false);
      expect(isAllowedSenderOrigin({ origin: "http://localhost:9999" })).toBe(
        false
      );
      expect(isAllowedSenderOrigin({ origin: "http://app.kaiord.com" })).toBe(
        false
      );
    });
  });

  describe("createEnvelope", () => {
    it("wraps success results with the protocol version", () => {
      const { sendResult } = createEnvelope(1);
      const respond = vi.fn();

      sendResult({ hello: true }, respond);

      expect(respond).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: { hello: true },
      });
    });

    it("serializes error fields, keeping optional markers only when set", () => {
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();
      const err = new Error("boom");
      err.status = 429;
      err.retryable = true;
      err.resetSeconds = 30;

      sendError(err, respond);

      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "boom",
        status: 429,
        retryable: true,
        resetSeconds: 30,
      });
    });

    it("omits optional error fields when absent", () => {
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();

      sendError(new Error("plain"), respond);

      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "plain",
      });
    });

    it("carries retryable: false explicitly when the thrower sets it", () => {
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();
      const err = new Error("no retry");
      err.retryable = false;

      sendError(err, respond);

      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ retryable: false })
      );
    });

    it("marks reauth conditions", () => {
      const { sendError } = createEnvelope(1);
      const respond = vi.fn();
      const err = new Error("expired");
      err.needsReauth = true;

      sendError(err, respond);

      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ needsReauth: true })
      );
    });
  });

  describe("createDispatch", () => {
    it("resolves the action handler into a success envelope", async () => {
      const dispatch = createDispatch({
        handleAction: vi.fn().mockResolvedValue({ pong: true }),
        protocolVersion: 1,
      });
      const respond = vi.fn();

      const returns = dispatch({ action: "ping" }, respond);
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      expect(returns).toBe(true);
      expect(respond).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: { pong: true },
      });
    });

    it("routes handler rejections through the error envelope", async () => {
      const dispatch = createDispatch({
        handleAction: vi.fn().mockRejectedValue(new Error("nope")),
        protocolVersion: 1,
      });
      const respond = vi.fn();

      dispatch({ action: "ping" }, respond);
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

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

    it("dispatches allowlisted actions from an allowed origin", async () => {
      const { handleAction, external } = setup();
      const respond = vi.fn();

      external(
        { action: "ping" },
        { origin: "https://app.kaiord.com" },
        respond
      );
      await vi.waitFor(() => expect(respond).toHaveBeenCalled());

      expect(handleAction).toHaveBeenCalledWith({ action: "ping" });
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ ok: true })
      );
    });

    it("rejects a foreign origin without invoking the handler", () => {
      const { handleAction, external } = setup();
      const respond = vi.fn();

      const returns = external(
        { action: "ping" },
        { origin: "https://attacker.example" },
        respond
      );

      expect(returns).toBe(true);
      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Origin or action not permitted",
        retryable: false,
      });
    });

    it("rejects an empty sender without invoking the handler", () => {
      const { handleAction, external } = setup();
      const respond = vi.fn();

      external({ action: "ping" }, {}, respond);

      expect(handleAction).not.toHaveBeenCalled();
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false })
      );
    });

    it("rejects actions outside the allowlist even from an allowed origin", () => {
      const { handleAction, external } = setup();
      const respond = vi.fn();

      external(
        { action: "set-credentials" },
        { origin: "https://app.kaiord.com" },
        respond
      );

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
