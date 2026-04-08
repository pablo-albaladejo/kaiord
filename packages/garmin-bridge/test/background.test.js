import { describe, it, expect, beforeEach } from "vitest";

// Capture listener callbacks registered at import time (before any reset)
const {
  PROTOCOL_VERSION,
  handleAction,
  getCsrfToken,
  checkSession,
} = require("../background.js");

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];
const webRequestCb =
  chrome.webRequest.onBeforeSendHeaders.addListener.mock.calls[0][0];

describe("background.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("PROTOCOL_VERSION", () => {
    it("should be 1", () => {
      expect(PROTOCOL_VERSION).toBe(1);
    });
  });

  describe("getCsrfToken", () => {
    it("returns null when no token stored", async () => {
      const token = await getCsrfToken();

      expect(token).toBeNull();
    });

    it("returns stored token", async () => {
      await chrome.storage.session.set({ csrfToken: "test-token" });

      const token = await getCsrfToken();

      expect(token).toBe("test-token");
    });
  });

  describe("webRequest listener", () => {
    it("captures CSRF token from request headers", () => {
      webRequestCb({
        requestHeaders: [{ name: "connect-csrf-token", value: "csrf-abc" }],
      });

      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        csrfToken: "csrf-abc",
      });
    });

    it("ignores requests without CSRF header", () => {
      webRequestCb({
        requestHeaders: [{ name: "content-type", value: "text/html" }],
      });

      expect(chrome.storage.session.set).not.toHaveBeenCalled();
    });

    it("ignores requests with no headers", () => {
      webRequestCb({});

      expect(chrome.storage.session.set).not.toHaveBeenCalled();
    });
  });

  describe("onMessageExternal listener", () => {
    it("returns true for async response", () => {
      const sendResponse = vi.fn();

      const result = externalCb({ action: "ping" }, {}, sendResponse);

      expect(result).toBe(true);
    });

    it("sends success result on resolved action", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 1 });
      const sendResponse = vi.fn();

      externalCb({ action: "open-garmin" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: null,
      });
    });

    it("sends error result on rejected action", async () => {
      const sendResponse = vi.fn();

      externalCb({ action: "unknown" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Unknown action: unknown",
      });
    });
  });

  describe("onMessage listener", () => {
    it("returns true for async response", () => {
      const sendResponse = vi.fn();

      const result = internalCb({ action: "ping" }, {}, sendResponse);

      expect(result).toBe(true);
    });

    it("sends result to popup", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 1 });
      const sendResponse = vi.fn();

      internalCb({ action: "open-garmin" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: null,
      });
    });
  });

  describe("handleAction", () => {
    it("rejects unknown action", async () => {
      await expect(handleAction({ action: "unknown" })).rejects.toThrow(
        "Unknown action: unknown"
      );
    });

    it("rejects push without gcn payload", async () => {
      await expect(handleAction({ action: "push" })).rejects.toThrow(
        "Missing gcn payload"
      );
    });

    it("handles ping with no Garmin tab", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));

      const result = await checkSession();

      expect(result.csrfCaptured).toBe(false);
      expect(result.gcApi.ok).toBe(false);
    });

    it("handles ping with CSRF token captured", async () => {
      await chrome.storage.session.set({ csrfToken: "abc" });
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));

      const result = await checkSession();

      expect(result.csrfCaptured).toBe(true);
    });

    it("handles open-garmin action", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 42 });

      const result = await handleAction({ action: "open-garmin" });

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://connect.garmin.com/modern/",
      });
      expect(result).toBeNull();
    });

    it("handles list with Garmin tab and successful response", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({
          ok: true,
          status: 200,
          data: [{ workoutId: 1, workoutName: "Test" }],
        })
      );

      const result = await handleAction({ action: "list" });

      expect(result).toEqual([{ workoutId: 1, workoutName: "Test" }]);
    });

    it("handles list failure with error message", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: false, error: "Blocked: disallowed path or method" })
      );

      await expect(handleAction({ action: "list" })).rejects.toThrow(
        "Blocked: disallowed path or method"
      );
    });

    it("handles list failure with status code", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: false, status: 403 })
      );

      await expect(handleAction({ action: "list" })).rejects.toThrow(
        "List failed: 403"
      );
    });

    it("preserves status on error through sendError", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: false, status: 403, error: "Forbidden" })
      );
      const sendResponse = vi.fn();

      externalCb({ action: "list" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Forbidden",
          status: 403,
        })
      );
    });

    it("handles push with gcn payload", async () => {
      const gcn = { workoutName: "My Workout" };
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) => {
        expect(msg.body).toEqual(gcn);
        expect(msg.method).toBe("POST");
        cb({ ok: true, status: 200, data: { workoutId: 123 } });
      });

      const result = await handleAction({ action: "push", gcn });

      expect(result).toEqual({ workoutId: 123 });
    });
  });
});
