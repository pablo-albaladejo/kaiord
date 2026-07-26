import { describe, it, expect, beforeEach } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  EXTERNAL_ACTIONS,
  handleAction,
  isAllowed,
  garminFetch,
  checkSession,
  listActivities,
  fetchActivitiesWithBackoff,
  pushBodyComposition,
  toUint8Array,
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

// A valid, non-expired token pair so the Bearer path skips minting.
const seedTokens = () =>
  chrome.storage.local.set({
    garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
    garminOAuth2: {
      access_token: "bear",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });

const jsonResp = (obj, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(obj),
  text: () => Promise.resolve(JSON.stringify(obj)),
});
const textResp = (body, ok = true, status = 200) => ({
  ok,
  status,
  text: () => Promise.resolve(body),
});

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
        capabilities: ["write:workouts", "read:activities", "write:body"],
      });
    });

    it("version matches package.json (no drift between background.js and the published version)", () => {
      expect(BRIDGE_MANIFEST.version).toBe(pkg.version);
    });

    it("validates against bridgeManifestSchema (replica of the SPA contract)", () => {
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

  // Inline replica of `bridgeManifestSchema` from
  // packages/workout-spa-editor/src/types/bridge-schemas.ts.
  function makeManifestValidator() {
    const ALLOWED_CAPABILITIES = new Set([
      "read:workouts",
      "write:workouts",
      "read:body",
      "write:body",
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

  describe("isAllowed", () => {
    it("allows GET /workout-service/workouts (with and without query)", () => {
      expect(isAllowed("GET", "/workout-service/workouts")).toBe(true);
      expect(
        isAllowed("GET", "/workout-service/workouts?start=0&limit=20")
      ).toBe(true);
    });

    it("allows POST /workout-service/workout", () => {
      expect(isAllowed("POST", "/workout-service/workout")).toBe(true);
    });

    it("allows GET the activities search endpoint but not POST", () => {
      expect(
        isAllowed("GET", "/activitylist-service/activities/search/activities")
      ).toBe(true);
      expect(
        isAllowed("POST", "/activitylist-service/activities/search/activities")
      ).toBe(false);
    });

    it("rejects disallowed paths and methods", () => {
      expect(isAllowed("GET", "/userprofile-service/usersettings")).toBe(false);
      expect(isAllowed("DELETE", "/workout-service/workout/123")).toBe(false);
      expect(isAllowed("POST", "/workout-service/workouts")).toBe(false);
    });

    it("should allow POST to the FIT upload endpoint with and without the /.fit suffix", () => {
      expect(isAllowed("POST", "/upload-service/upload")).toBe(true);
      expect(isAllowed("POST", "/upload-service/upload/.fit")).toBe(true);
    });

    it("should deny upload look-alike paths and non-POST methods on the upload endpoint", () => {
      expect(isAllowed("GET", "/upload-service/upload/.fit")).toBe(false);
      expect(isAllowed("POST", "/upload-service/uploads")).toBe(false);
      expect(isAllowed("POST", "/upload-service/upload-malicious")).toBe(false);
      expect(isAllowed("POST", "/upload-service/download/.fit")).toBe(false);
    });
  });

  describe("garminFetch", () => {
    it("blocks a disallowed path before hitting the network", async () => {
      const res = await garminFetch("/userprofile-service/usersettings", "GET");

      expect(res).toEqual({
        ok: false,
        error: "Blocked: disallowed path or method",
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("issues a Bearer call to connectapi for an allowed path", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([{ workoutId: 1 }]));

      const res = await garminFetch(
        "/workout-service/workouts?start=0&limit=1",
        "GET"
      );

      expect(res).toEqual({ ok: true, status: 200, data: [{ workoutId: 1 }] });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(
        "https://connectapi.garmin.com/workout-service/workouts?start=0&limit=1"
      );
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.credentials).toBe("omit");
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
      const sendResponse = vi.fn();

      externalCb({ action: "unknown" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Origin or action not permitted",
        retryable: false,
      });
    });

    it("should reject an empty sender for every external action", async () => {
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(fetch).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });

    it("should reject a foreign origin without invoking the action handler", async () => {
      const sendResponse = vi.fn();

      externalCb(
        { action: "list" },
        { origin: "https://attacker.example" },
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(fetch).not.toHaveBeenCalled();
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

    it("surfaces unknown-action errors on the internal channel", async () => {
      const sendResponse = vi.fn();

      internalCb({ action: "unknown" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Unknown action: unknown",
      });
    });
  });

  describe("checkSession (ping)", () => {
    it("reports authenticated + gcApi on the happy path", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([{ workoutId: 1 }]));

      const result = await checkSession();

      expect(result.authenticated).toBe(true);
      expect(result.gcApi).toEqual({
        ok: true,
        status: 200,
        data: [{ workoutId: 1 }],
      });
      expect(result).toMatchObject({
        id: "garmin-bridge",
        name: "Garmin Connect",
        version: pkg.version,
        protocolVersion: 1,
        capabilities: ["write:workouts", "read:activities", "write:body"],
      });
    });

    it("reports not-authenticated when there is no session to mint from", async () => {
      // No stored tokens → mint from session → SSO page has no ticket.
      fetch.mockResolvedValue(textResp("<html><form>sign in</form></html>"));

      const result = await checkSession();

      expect(result.authenticated).toBe(false);
      expect(result.gcApi.ok).toBe(false);
    });

    it("keeps manifest fields authoritative if the upstream API leaks id/version", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(
        jsonResp({ id: "ATTACKER", version: "99.9.9", workouts: [] })
      );

      const result = await checkSession();

      expect(result.id).toBe("garmin-bridge");
      expect(result.version).toBe(pkg.version);
      // The rogue keys stay nested in gcApi.data (Zod strips gcApi SPA-side).
      expect(result.gcApi.data.id).toBe("ATTACKER");
    });

    it("wraps checkSession in the full SPA envelope via externalCb", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([{ workoutId: 1 }]));
      const sendResponse = vi.fn();

      externalCb({ action: "ping" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse.mock.calls[0][0]).toMatchObject({
        ok: true,
        protocolVersion: 1,
        data: {
          id: "garmin-bridge",
          name: "Garmin Connect",
          version: pkg.version,
          protocolVersion: 1,
          capabilities: ["write:workouts", "read:activities", "write:body"],
          authenticated: true,
          gcApi: { ok: true, status: 200, data: [{ workoutId: 1 }] },
        },
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

    it("handles open-garmin action", async () => {
      chrome.tabs.create.mockResolvedValue({ id: 42 });

      const result = await handleAction({ action: "open-garmin" });

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://connect.garmin.com/modern/",
      });
      expect(result).toBeNull();
    });

    it("handles list with a successful response", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(
        jsonResp([{ workoutId: 1, workoutName: "Test" }])
      );

      const result = await handleAction({ action: "list" });

      expect(result).toEqual([{ workoutId: 1, workoutName: "Test" }]);
    });

    it("handles list failure with status code", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(textResp("Forbidden", false, 403));

      await expect(handleAction({ action: "list" })).rejects.toThrow(
        "List failed: 403"
      );
    });

    it("preserves status on error through the envelope", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(textResp("Forbidden", false, 403));
      const sendResponse = vi.fn();

      externalCb({ action: "list" }, SPA_SENDER, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false, status: 403 })
      );
    });

    it("handles push with gcn payload", async () => {
      seedTokens();
      const gcn = { workoutName: "My Workout" };
      fetch.mockResolvedValueOnce(jsonResp({ workoutId: 123 }));

      const result = await handleAction({ action: "push", gcn });

      expect(result).toEqual({ workoutId: 123 });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(
        "https://connectapi.garmin.com/workout-service/workout"
      );
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify(gcn));
    });

    it("routes the activities action to listActivities", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([{ activityId: 5 }]));

      const result = await handleAction({ action: "activities" });

      expect(result).toEqual({
        activities: [{ activityId: 5 }],
        disabled: false,
        throttled: false,
      });
    });
  });

  describe("push-body-composition", () => {
    const UPLOAD_URL =
      "https://connectapi.garmin.com/upload-service/upload/.fit";

    it("should upload a base64 FIT payload as multipart with a Bearer header and no cookies", async () => {
      // Arrange
      seedTokens();
      const importResult = { detailedImportResult: { uploadId: 99 } };
      fetch.mockResolvedValueOnce(jsonResp(importResult));

      // Act
      const result = await handleAction({
        action: "push-body-composition",
        fit: btoa("FITDATA"),
      });

      // Assert
      expect(result).toEqual(importResult);
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(UPLOAD_URL);
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.credentials).toBe("omit");
      expect(init.headers["Content-Type"]).toBeUndefined();
      expect(init.body).toBeInstanceOf(FormData);
    });

    it("should accept a byte-array FIT payload and post it as multipart", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp({ uploaded: true }));

      // Act
      const result = await handleAction({
        action: "push-body-composition",
        fit: [12, 34, 56],
      });

      // Assert
      expect(result).toEqual({ uploaded: true });
      expect(fetch.mock.calls[0][1].body).toBeInstanceOf(FormData);
    });

    it("should reject push-body-composition without a fit payload", async () => {
      // Arrange
      const message = { action: "push-body-composition" };

      // Act
      const call = handleAction(message);

      // Assert
      await expect(call).rejects.toThrow("Missing fit payload");
    });

    it("should surface the upload failure status through the error envelope", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(textResp("Payload Too Large", false, 413));

      // Act
      const call = handleAction({
        action: "push-body-composition",
        fit: btoa("x"),
      });

      // Assert
      await expect(call).rejects.toThrow("Body composition upload failed: 413");
    });

    it("should expose push-body-composition as an allowlisted external action", () => {
      // Arrange

      // Act
      const allowed = EXTERNAL_ACTIONS.has("push-body-composition");

      // Assert
      expect(allowed).toBe(true);
    });

    it("should reject a FIT payload that is neither a string nor an array", () => {
      // Arrange
      const badPayload = { not: "valid" };

      // Act
      const call = () => toUint8Array(badPayload);

      // Assert
      expect(call).toThrow("Invalid FIT payload");
    });
  });

  describe("listActivities", () => {
    it("returns the raw feed and stamps the throttle timestamp on the happy path", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([{ activityId: 111 }]));

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
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([]));

      await listActivities();

      expect(fetch.mock.calls[0][0]).toBe(
        "https://connectapi.garmin.com/activitylist-service/activities/search/activities?start=0&limit=20"
      );
    });

    it("short-circuits without fetching when the kill-switch flag is set", async () => {
      await chrome.storage.local.set({ activitiesPullDisabled: true });

      const result = await listActivities();

      expect(result).toEqual({
        activities: [],
        disabled: true,
        throttled: false,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("throttles a second pull within the minimum interval", async () => {
      await chrome.storage.session.set({ lastActivitiesFetchAt: Date.now() });

      const result = await listActivities();

      expect(result).toEqual({
        activities: [],
        disabled: false,
        throttled: true,
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("returns an empty feed when the endpoint yields a non-array payload", async () => {
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp(null));

      const result = await listActivities();

      expect(result.activities).toEqual([]);
    });

    it("treats an overlapping pull as throttled without a second fetch", async () => {
      seedTokens();
      let release;
      fetch.mockImplementationOnce(
        () => new Promise((resolve) => {
          release = () => resolve(jsonResp([]));
        })
      );

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
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchActivitiesWithBackoff", () => {
    it("retries a transient failure then returns the payload", async () => {
      seedTokens();
      fetch
        .mockResolvedValueOnce(textResp("boom", false, 503))
        .mockResolvedValueOnce(jsonResp([{ activityId: 9 }]));

      const result = await fetchActivitiesWithBackoff(3, 0);

      expect(result).toEqual([{ activityId: 9 }]);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("throws after exhausting all attempts", async () => {
      seedTokens();
      fetch.mockResolvedValue(textResp("boom", false, 503));

      await expect(fetchActivitiesWithBackoff(2, 0)).rejects.toThrow(
        "Activities pull failed: 503"
      );
    });
  });

  describe("logSwallowed", () => {
    it("records a structured entry (level, action, cause, timestamp)", async () => {
      await logSwallowed("error", "load-garmin-oauth", new Error("boom"));

      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toEqual([
        {
          level: "error",
          action: "load-garmin-oauth",
          cause: "boom",
          at: expect.any(Number),
        },
      ]);
    });

    it("caps the log to the most recent 25 entries", async () => {
      for (let i = 0; i < 30; i += 1) {
        await logSwallowed("warn", "x", `err-${i}`);
      }

      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toHaveLength(25);
      expect(log[0].cause).toBe("err-5");
      expect(log[24].cause).toBe("err-29");
    });
  });
});
