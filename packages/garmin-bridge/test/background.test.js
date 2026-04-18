import { describe, it, expect, beforeEach } from "vitest";

// Capture listener callbacks registered at import time (before any reset)
const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  handleAction,
  getCsrfToken,
  checkSession,
} = require("../background.js");
const pkg = require("../package.json");

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

  describe("BRIDGE_MANIFEST", () => {
    it("has correct shape matching bridgeManifestSchema", () => {
      expect(BRIDGE_MANIFEST).toEqual({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["write:workouts"],
      });
    });

    it("version matches package.json (no drift between background.js and the published version)", () => {
      expect(BRIDGE_MANIFEST.version).toBe(pkg.version);
    });

    it("validates against bridgeManifestSchema (replica of the SPA contract)", () => {
      // Mirrors the Zod rules in `bridgeManifestSchema` from
      // packages/workout-spa-editor/src/types/bridge-schemas.ts exactly:
      // id/name/version are bare z.string() (no min length),
      // protocolVersion is positive int, capabilities is z.array(...) (no
      // .nonempty()) of values from bridgeCapabilitySchema. If you change
      // the SPA schema, change this replica.
      const validate = makeManifestValidator();

      expect(validate(BRIDGE_MANIFEST)).toEqual([]);
    });

    it("replica rejects malformed manifests (not a pass-everything stub)", () => {
      const validate = makeManifestValidator();

      expect(validate({ ...BRIDGE_MANIFEST, capabilities: ["bogus"] })).toEqual(
        expect.arrayContaining([expect.stringMatching(/not in allowed enum/)])
      );
      expect(validate({ ...BRIDGE_MANIFEST, protocolVersion: 0 })).toEqual(
        expect.arrayContaining([expect.stringMatching(/protocolVersion/)])
      );
      expect(validate({ ...BRIDGE_MANIFEST, id: 42 })).toEqual(
        expect.arrayContaining([expect.stringMatching(/id must be string/)])
      );
    });
  });

  // Inline replica of `bridgeManifestSchema` — see the test above for the
  // canonical comment. Extracted so the negative-path test can re-use it.
  function makeManifestValidator() {
    const ALLOWED_CAPABILITIES = new Set([
      "read:workouts",
      "write:workouts",
      "read:body",
      "read:sleep",
      "read:training-plan",
    ]);
    return (m) => {
      const errors = [];
      if (typeof m?.id !== "string") errors.push("id must be string");
      if (typeof m?.name !== "string") errors.push("name must be string");
      if (typeof m?.version !== "string") errors.push("version must be string");
      if (
        typeof m?.protocolVersion !== "number" ||
        !Number.isInteger(m.protocolVersion) ||
        m.protocolVersion < 1
      )
        errors.push("protocolVersion must be a positive integer");
      if (!Array.isArray(m?.capabilities))
        errors.push("capabilities must be an array");
      for (const c of m?.capabilities ?? []) {
        if (!ALLOWED_CAPABILITIES.has(c))
          errors.push(`capabilities[] contains "${c}" not in allowed enum`);
      }
      return errors;
    };
  }

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

  describe("ping response backward compatibility", () => {
    it("includes protocolVersion at top level alongside session data", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      const response = sendResponse.mock.calls[0][0];

      // New structure fields
      expect(response).toHaveProperty("ok", true);
      expect(response).toHaveProperty("protocolVersion", 1);
      expect(response).toHaveProperty("data");

      // Session data nested in data
      expect(response.data).toHaveProperty("csrfCaptured");
      expect(response.data).toHaveProperty("gcApi");
    });

    it("includes bridge manifest fields in data envelope", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      const response = sendResponse.mock.calls[0][0];

      expect(response.data).toMatchObject({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["write:workouts"],
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

    it("handles ping happy path (Garmin tab open, API responds OK)", async () => {
      await chrome.storage.session.set({ csrfToken: "abc" });
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 7 }]));
      chrome.tabs.sendMessage.mockImplementation((_tabId, _msg, cb) => {
        cb({ ok: true, data: [{ workoutId: 1 }] });
      });

      const result = await checkSession();

      expect(result.csrfCaptured).toBe(true);
      expect(result.gcApi).toEqual({ ok: true, data: [{ workoutId: 1 }] });
      expect(result).toMatchObject({
        id: "garmin-bridge",
        name: "Garmin Connect",
        protocolVersion: 1,
        capabilities: ["write:workouts"],
      });
    });

    it("ping via externalCb wraps checkSession in the full SPA envelope", async () => {
      await chrome.storage.session.set({ csrfToken: "abc" });
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 7 }]));
      chrome.tabs.sendMessage.mockImplementation((_tabId, _msg, cb) => {
        cb({ ok: true, data: [{ workoutId: 1 }] });
      });
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      const response = sendResponse.mock.calls[0][0];

      // The SPA's parseManifestFromPing reads response.data — it MUST
      // contain every BridgeManifest field plus the session-status
      // fields the popup/UI consume.
      expect(response).toMatchObject({
        ok: true,
        protocolVersion: 1,
        data: {
          id: "garmin-bridge",
          name: "Garmin Connect",
          version: pkg.version,
          protocolVersion: 1,
          capabilities: ["write:workouts"],
          csrfCaptured: true,
          gcApi: { ok: true, data: [{ workoutId: 1 }] },
        },
      });
    });

    it("manifest fields take precedence if upstream API leaks an id/version", async () => {
      // Defends against a future Garmin API change that returns its own
      // `id`/`version` keys at the top level of the response. The spread
      // order in checkSession (`{ ...BRIDGE_MANIFEST, csrfCaptured, gcApi }`)
      // ensures the manifest-only fields cannot be overwritten by the
      // upstream payload (gcApi keeps the rogue keys nested but they
      // never bubble up to response.data).
      await chrome.storage.session.set({ csrfToken: "abc" });
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 7 }]));
      chrome.tabs.sendMessage.mockImplementation((_tabId, _msg, cb) => {
        cb({ ok: true, id: "ATTACKER", version: "99.9.9", data: [] });
      });

      const result = await checkSession();

      expect(result.id).toBe("garmin-bridge");
      expect(result.version).toBe(pkg.version);
      // The rogue keys are inside gcApi, which Zod will strip.
      expect(result.gcApi.id).toBe("ATTACKER");
    });

    it("checkSession returns manifest fields alongside session status", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));

      const result = await checkSession();

      expect(result).toMatchObject({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["write:workouts"],
      });
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
