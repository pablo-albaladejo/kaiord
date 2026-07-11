import { describe, it, expect, beforeEach } from "vitest";

// Capture listener callbacks registered at import time (before any reset)
const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  handleAction,
  getCsrfToken,
  checkSession,
  listActivities,
  fetchActivitiesWithBackoff,
  reinjectContentScripts,
  logSwallowed,
  TELEMETRY_KEY,
} = require("../background.js");
const pkg = require("../package.json");

// External senders are origin-pinned by the vendored guard (spec:
// bridge-core, D4 tightening) — positive paths use an allowed SPA origin.
const SPA_SENDER = { origin: "https://app.kaiord.com" };

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];
const webRequestCb =
  chrome.webRequest.onBeforeSendHeaders.addListener.mock.calls[0][0];
const onInstalledCb = chrome.runtime.onInstalled.addListener.mock.calls[0][0];

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
        capabilities: ["write:workouts", "read:activities"],
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
      "read:training-zones",
      "read:activities",
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

      const result = externalCb({ action: "ping" }, SPA_SENDER, sendResponse);

      expect(result).toBe(true);
    });

    it("sends success result on resolved action", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 1 });
      const sendResponse = vi.fn();

      externalCb({ action: "open-garmin" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        protocolVersion: 1,
        data: null,
      });
    });

    it("should reject a non-allowlisted action before the handler runs", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb({ action: "unknown" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Origin or action not permitted",
        retryable: false,
      });
    });

    it("should reject an empty sender for every external action", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(chrome.tabs.query).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });

    it("should reject a foreign origin without invoking the action handler", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb(
        { action: "list" },
        { origin: "https://attacker.example" },
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(chrome.tabs.query).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Origin or action not permitted",
        retryable: false,
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

    it("should surface unknown-action errors on the internal channel", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      internalCb({ action: "unknown" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Unknown action: unknown",
      });
    });
  });

  describe("ping response backward compatibility", () => {
    it("includes protocolVersion at top level alongside session data", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([]));
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, SPA_SENDER, sendResponse);
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

      externalCb({ action: "ping" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      const response = sendResponse.mock.calls[0][0];

      expect(response.data).toMatchObject({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["write:workouts", "read:activities"],
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
        capabilities: ["write:workouts", "read:activities"],
      });
    });

    it("ping via externalCb wraps checkSession in the full SPA envelope", async () => {
      await chrome.storage.session.set({ csrfToken: "abc" });
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 7 }]));
      chrome.tabs.sendMessage.mockImplementation((_tabId, _msg, cb) => {
        cb({ ok: true, data: [{ workoutId: 1 }] });
      });
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, SPA_SENDER, sendResponse);
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
          capabilities: ["write:workouts", "read:activities"],
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
        capabilities: ["write:workouts", "read:activities"],
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

      externalCb({ action: "list" }, SPA_SENDER, sendResponse);
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

    it("routes the activities action to listActivities", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: true, status: 200, data: [{ activityId: 5 }] })
      );

      const result = await handleAction({ action: "activities" });

      expect(result).toEqual({
        activities: [{ activityId: 5 }],
        disabled: false,
        throttled: false,
      });
    });
  });

  describe("listActivities", () => {
    it("returns the raw feed and stamps the throttle timestamp on the happy path", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: true, status: 200, data: [{ activityId: 111 }] })
      );

      const result = await listActivities();

      expect(result).toEqual({
        activities: [{ activityId: 111 }],
        disabled: false,
        throttled: false,
      });
      expect(chrome.storage.session.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastActivitiesFetchAt: expect.any(Number) })
      );
    });

    it("requests the read-only activities search endpoint", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) => {
        expect(msg.method).toBe("GET");
        expect(msg.path).toBe(
          "/activitylist-service/activities/search/activities?start=0&limit=20"
        );
        cb({ ok: true, status: 200, data: [] });
      });

      await listActivities();

      expect(chrome.tabs.sendMessage).toHaveBeenCalled();
    });

    it("short-circuits without fetching when the kill-switch flag is set", async () => {
      await chrome.storage.local.set({ activitiesPullDisabled: true });
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));

      const result = await listActivities();

      expect(result).toEqual({
        activities: [],
        disabled: true,
        throttled: false,
      });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it("throttles a second pull within the minimum interval", async () => {
      await chrome.storage.session.set({ lastActivitiesFetchAt: Date.now() });
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));

      const result = await listActivities();

      expect(result).toEqual({
        activities: [],
        disabled: false,
        throttled: true,
      });
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    it("returns an empty feed when the endpoint yields a non-array payload", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: true, status: 200, data: null })
      );

      const result = await listActivities();

      expect(result.activities).toEqual([]);
    });

    it("treats an overlapping pull as throttled without a second fetch", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      let release;
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) => {
        release = () => cb({ ok: true, status: 200, data: [] });
      });

      const first = listActivities();
      const overlapping = await listActivities();
      while (!release) await new Promise((r) => setTimeout(r, 0));
      release();
      const firstResult = await first;

      expect(overlapping).toEqual({
        activities: [],
        disabled: false,
        throttled: true,
      });
      expect(firstResult.throttled).toBe(false);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchActivitiesWithBackoff", () => {
    it("retries a transient failure then returns the payload", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      let calls = 0;
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) => {
        calls += 1;
        if (calls === 1) cb({ ok: false, status: 503 });
        else cb({ ok: true, status: 200, data: [{ activityId: 9 }] });
      });

      const result = await fetchActivitiesWithBackoff(3, 0);

      expect(result).toEqual([{ activityId: 9 }]);
      expect(calls).toBe(2);
    });

    it("throws after exhausting all attempts", async () => {
      chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 1 }]));
      chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
        cb({ ok: false, status: 503 })
      );

      await expect(fetchActivitiesWithBackoff(2, 0)).rejects.toThrow(
        "Activities pull failed: 503"
      );
    });
  });

  describe("reinjectContentScripts", () => {
    it("re-injects content.js into existing connect.garmin.com tabs", async () => {
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: ["https://connect.garmin.com/*"],
        content_scripts: [
          {
            matches: ["https://connect.garmin.com/*"],
            js: ["content.js"],
            run_at: "document_start",
          },
        ],
      });
      chrome.tabs.query.mockImplementation(() =>
        Promise.resolve([{ id: 21, url: "https://connect.garmin.com/modern/" }])
      );

      await reinjectContentScripts();

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 21, allFrames: false },
        files: ["content.js"],
      });
    });

    it("skips content scripts whose matches are not in host_permissions", async () => {
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: ["https://connect.garmin.com/*"],
        content_scripts: [
          {
            matches: ["https://*.kaiord.com/*"],
            js: ["kaiord-announce.js"],
          },
        ],
      });

      await reinjectContentScripts();

      expect(chrome.tabs.query).not.toHaveBeenCalled();
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it("swallows per-tab executeScript errors", async () => {
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: ["https://connect.garmin.com/*"],
        content_scripts: [
          {
            matches: ["https://connect.garmin.com/*"],
            js: ["content.js"],
          },
        ],
      });
      chrome.tabs.query.mockImplementation(() =>
        Promise.resolve([
          { id: 21, url: "https://connect.garmin.com/modern/" },
          { id: 22, url: "https://connect.garmin.com/modern/calendar" },
        ])
      );
      chrome.scripting.executeScript
        .mockRejectedValueOnce(new Error("Cannot access tab"))
        .mockResolvedValueOnce([]);

      await expect(reinjectContentScripts()).resolves.toBeUndefined();
      expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      await vi.waitFor(() => {
        const log = __chromeLocalStore[TELEMETRY_KEY];
        expect(log).toHaveLength(1);
        expect(log[0]).toMatchObject({
          level: "warn",
          action: "reinject-content-script",
          cause: "Cannot access tab",
        });
        expect(log[0].at).toEqual(expect.any(Number));
      });
    });

    it("the onInstalled listener invokes reinjectContentScripts", async () => {
      // onInstalledCb was captured at module load (before
      // __resetChromeMock cleared the mock.calls log); invoking it
      // exercises the otherwise-unreached arrow function.
      chrome.runtime.getManifest.mockReturnValue({
        host_permissions: [],
        content_scripts: [],
      });

      await expect(Promise.resolve(onInstalledCb())).resolves.toBeUndefined();
    });
  });

  describe("logSwallowed", () => {
    it("records a structured entry (level, action, cause, timestamp)", async () => {
      await logSwallowed("error", "load-profile-snapshot", new Error("boom"));

      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toEqual([
        {
          level: "error",
          action: "load-profile-snapshot",
          cause: "boom",
          at: expect.any(Number),
        },
      ]);
    });

    it("caps the log to the most recent 25 entries", async () => {
      for (let i = 0; i < 30; i += 1) {
        await logSwallowed("warn", "reinject-content-script", `err-${i}`);
      }

      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toHaveLength(25);
      expect(log[0].cause).toBe("err-5");
      expect(log[24].cause).toBe("err-29");
    });
  });
});
