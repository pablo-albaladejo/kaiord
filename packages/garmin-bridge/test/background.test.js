import { describe, it, expect, beforeEach, afterEach } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  BRIDGE_FEATURES,
  EXTERNAL_ACTIONS,
  handleAction,
  isAllowed,
  garminFetch,
  checkSession,
  listActivities,
  fetchActivitiesWithBackoff,
  toUint8Array,
  logSwallowed,
  TELEMETRY_KEY,
  scheduleWorkout,
  findCalendarEntries,
  isIsoDate,
  CALENDAR_DEADLINE_MS,
  CALENDAR_SEND_CUTOFF_MS,
  DEADLINE_BEFORE_SEND,
  DEADLINE_EXCEEDED,
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

    it("should allow POST and DELETE on a digits-only calendar schedule path", () => {
      // Arrange
      const path = "/workout-service/schedule/1790718680";

      // Act
      const allowed = [isAllowed("POST", path), isAllowed("DELETE", path)];

      // Assert
      expect(allowed).toEqual([true, true]);
    });

    it("should allow GET on a calendar month path only", () => {
      // Arrange
      const path = "/calendar-service/year/2026/month/9";

      // Act
      const allowed = [
        isAllowed("GET", path),
        isAllowed("POST", path),
        isAllowed("DELETE", path),
      ];

      // Assert
      expect(allowed).toEqual([true, false, false]);
    });

    it.each([
      ["GET", "/calendar-service/year/26/month/9"],
      ["GET", "/calendar-service/year/2026/month/123"],
      ["GET", "/calendar-service/year/2026/month/9?start=1"],
      ["GET", "/calendar-service/year/2026/month/9/day/1"],
      ["GET", "/calendar-service/year/2026"],
      ["GET", "/workout-service/schedule/1790718680"],
      ["PUT", "/workout-service/schedule/1790718680"],
      ["POST", "/workout-service/schedule/abc"],
      ["POST", "/workout-service/schedule/"],
      ["POST", "/workout-service/schedule/1/2"],
      ["POST", "/workout-service/schedule/1?x=1"],
      ["DELETE", "/workout-service/schedule/1%2F2"],
      ["DELETE", "/workout-service/workout/123"],
    ])("should reject %s %s on the calendar surface", (method, path) => {
      // Arrange
      // (method and path come from the table)

      // Act
      const allowed = isAllowed(method, path);

      // Assert
      expect(allowed).toBe(false);
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

    it("should report the calendar feature flags outside the manifest", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp([]));

      // Act
      const result = await checkSession();

      // Assert
      expect(result.features).toEqual([
        "calendar-write-v1",
        "calendar-find-v1",
      ]);
      expect(BRIDGE_FEATURES).toEqual([
        "calendar-write-v1",
        "calendar-find-v1",
      ]);
      expect(BRIDGE_MANIFEST).not.toHaveProperty("features");
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
          features: ["calendar-write-v1", "calendar-find-v1"],
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
      expect(url).toBe("https://connectapi.garmin.com/workout-service/workout");
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
        () =>
          new Promise((resolve) => {
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

  describe("EXTERNAL_ACTIONS origin pinning", () => {
    // Pins the exact set, the way tanita/train2go/trainingpeaks do. The
    // previous assertion here was `EXTERNAL_ACTIONS.has("push-body-composition")`,
    // which says one action is present, not which actions exist — so a new
    // externally reachable action passed this suite, the privacy-surface
    // golden (blind to EXTERNAL_ACTIONS at the time) and `pnpm test:scripts`.
    // garmin-bridge is the published extension.
    it("should expose exactly the probe + read + write + navigation surface", () => {
      // Arrange
      const expected = [
        "ping",
        "list",
        "activities",
        "push",
        "push-body-composition",
        "open-garmin",
        "profile-snapshot",
        "profile-snapshot-clear",
        "schedule",
        "unschedule",
        "calendar-find",
      ];

      // Act
      const actual = [...EXTERNAL_ACTIONS];

      // Assert
      expect(actual).toEqual(expected);
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

  describe("calendar placement actions", () => {
    const SCHEDULE_URL =
      "https://connectapi.garmin.com/workout-service/schedule/1707805999";
    const noContent = () => ({
      ok: true,
      status: 204,
      json: () => Promise.reject(new Error("no body")),
      text: () => Promise.resolve(""),
    });

    afterEach(() => {
      fetch.mockReset();
    });

    it("should POST the date and return only the schedule id as a digit string", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(
        jsonResp({ workoutScheduleId: 1790718680, workout: { workoutId: 1 } })
      );

      // Act
      const result = await handleAction({
        action: "schedule",
        workoutId: "1707805999",
        date: "2026-09-29",
      });

      // Assert
      expect(result).toEqual({ workoutScheduleId: "1790718680" });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(SCHEDULE_URL);
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ date: "2026-09-29" }));
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.credentials).toBe("omit");
    });

    it("should return a null schedule id when a 2xx carries no usable id", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp({ workout: { workoutId: 1 } }));

      // Act
      const result = await scheduleWorkout("1707805999", "2026-09-29");

      // Assert
      expect(result).toEqual({ workoutScheduleId: null });
    });

    it("should keep the 404 status Garmin returns for an unknown workout id", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(textResp("Not Found", false, 404));

      // Act
      const error = await scheduleWorkout("1", "2026-09-29").catch((e) => e);

      // Assert
      expect(error.message).toBe("Schedule failed: 404");
      expect(error.status).toBe(404);
    });

    it.each([
      [{ action: "schedule", workoutId: "12a", date: "2026-09-29" }],
      [{ action: "schedule", workoutId: 1707805999, date: "2026-09-29" }],
      [{ action: "schedule", workoutId: "../1", date: "2026-09-29" }],
      [{ action: "schedule", workoutId: "01707805999", date: "2026-09-29" }],
      [{ action: "schedule", workoutId: "0", date: "2026-09-29" }],
      [{ action: "unschedule", scheduleId: "01790718680" }],
      [{ action: "schedule", workoutId: "1", date: "2026-02-30" }],
      [{ action: "schedule", workoutId: "1", date: "2026-9-29" }],
      [{ action: "schedule", workoutId: "1" }],
      [{ action: "unschedule", scheduleId: "" }],
      [{ action: "unschedule", scheduleId: "1/2" }],
      [{ action: "unschedule" }],
    ])("should refuse invalid input %j before any fetch", async (message) => {
      // Arrange
      seedTokens();

      // Act
      const error = await handleAction(message).catch((e) => e);

      // Assert
      expect(error.message).toMatch(/^Invalid /);
      expect(error.retryable).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should accept only real calendar dates", () => {
      // Arrange
      const dates = ["2028-02-29", "2026-02-29", "2026-13-01", "2026-12-31"];

      // Act
      const valid = dates.map(isIsoDate);

      // Assert
      expect(valid).toEqual([true, false, false, true]);
    });

    it("should DELETE the schedule id and map a 204 to null", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(noContent());

      // Act
      const result = await handleAction({
        action: "unschedule",
        scheduleId: "1790718680",
      });

      // Assert
      expect(result).toBeNull();
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(
        "https://connectapi.garmin.com/workout-service/schedule/1790718680"
      );
      expect(init.method).toBe("DELETE");
      expect(init.body).toBeUndefined();
    });

    it.each([404, 500])(
      "should keep the %s status of a failed unschedule through the envelope",
      async (status) => {
        // Arrange
        seedTokens();
        fetch.mockResolvedValueOnce(textResp("err", false, status));
        const sendResponse = vi.fn();

        // Act
        externalCb(
          { action: "unschedule", scheduleId: "1790718680" },
          SPA_SENDER,
          sendResponse
        );
        await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

        // Assert
        expect(sendResponse).toHaveBeenCalledWith({
          ok: false,
          protocolVersion: 1,
          error: `Unschedule failed: ${status}`,
          status,
        });
      }
    );
  });

  describe("calendar write outcomes without a deadline", () => {
    const scheduleVia = async () => {
      const sendResponse = vi.fn();
      externalCb(
        { action: "schedule", workoutId: "1707805999", date: "2026-09-29" },
        SPA_SENDER,
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());
      return sendResponse.mock.calls[0][0];
    };

    afterEach(() => {
      fetch.mockReset();
    });

    it("should answer a 2xx whose body fails to parse with no status and no definite refusal", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Unexpected end of JSON")),
      });

      // Act
      const envelope = await scheduleVia();

      // Assert
      expect(envelope.ok).toBe(false);
      expect(envelope.status).toBeUndefined();
      expect(envelope.retryable).not.toBe(false);
      expect(envelope.needsReauth).toBeUndefined();
    });

    it("should answer a network failure on the POST with no status and no definite refusal", async () => {
      // Arrange
      seedTokens();
      fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      // Act
      const envelope = await scheduleVia();

      // Assert
      expect(envelope).toEqual({
        ok: false,
        protocolVersion: 1,
        error: "Failed to fetch",
      });
    });

    it("should keep a 5xx status on a failed schedule", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(textResp("busy", false, 503));

      // Act
      const envelope = await scheduleVia();

      // Assert
      expect(envelope).toEqual({
        ok: false,
        protocolVersion: 1,
        error: "Schedule failed: 503",
        status: 503,
      });
    });
  });

  describe("calendar-find", () => {
    // Shaped on the live T0b capture: numeric ids, `itemType`, a
    // `YYYY-MM-DD` date, and many other keys that must not leave the SW.
    const item = (overrides) => ({
      id: 1792409369,
      groupId: null,
      trainingPlanId: 0,
      itemType: "workout",
      activityTypeId: null,
      date: "2026-10-06",
      sportTypeKey: "running",
      workoutId: 1711500235,
      protectedWorkoutSchedule: false,
      title: "Tempo 5k",
      workoutUuid: null,
      ...overrides,
    });
    const monthResp = (calendarItems) =>
      jsonResp({ year: 2026, month: 9, calendarItems });

    afterEach(() => {
      fetch.mockReset();
    });

    it("should request the 0-based month of the date and return only the workout's entries as strings", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(
        monthResp([
          item(),
          item({ id: 1792409370, date: "2026-10-20" }),
          item({ id: 1792409371, workoutId: 999 }),
          item({
            id: 5,
            itemType: "activity",
            workoutId: 1711500235,
            title: "Morning Run",
            distance: 10000,
          }),
          item({ id: 6, itemType: "race", workoutId: null }),
        ])
      );

      // Act
      const result = await handleAction({
        action: "calendar-find",
        workoutId: "1711500235",
        date: "2026-10-06",
      });

      // Assert
      expect(fetch.mock.calls[0][0]).toBe(
        "https://connectapi.garmin.com/calendar-service/year/2026/month/9"
      );
      expect(fetch.mock.calls[0][1].method).toBe("GET");
      expect(result).toEqual([
        { workoutScheduleId: "1792409369", date: "2026-10-06" },
        { workoutScheduleId: "1792409370", date: "2026-10-20" },
      ]);
    });

    it.each([
      ["2026-01-31", "year/2026/month/0"],
      ["2026-09-29", "year/2026/month/8"],
      ["2026-12-01", "year/2026/month/11"],
    ])("should map %s to %s", async (date, suffix) => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(monthResp([]));

      // Act
      await findCalendarEntries("1711500235", date);

      // Assert
      expect(fetch.mock.calls[0][0]).toBe(
        `https://connectapi.garmin.com/calendar-service/${suffix}`
      );
    });

    it("should answer found-none as an empty list", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(monthResp([item({ workoutId: 1 })]));

      // Act
      const result = await findCalendarEntries("1711500235", "2026-10-06");

      // Assert
      expect(result).toEqual([]);
    });

    it("should return a null schedule id for an entry whose id is unusable", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(monthResp([item({ id: null })]));

      // Act
      const result = await findCalendarEntries("1711500235", "2026-10-06");

      // Assert
      expect(result).toEqual([{ workoutScheduleId: null, date: "2026-10-06" }]);
    });

    it.each([
      ["no calendarItems", { year: 2026, month: 9 }],
      ["a non-array calendarItems", { calendarItems: {} }],
      ["a null body", null],
    ])("should fail the read, not report none, on %s", async (_label, body) => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(jsonResp(body));

      // Act
      const error = await findCalendarEntries("1711500235", "2026-10-06").catch(
        (e) => e
      );

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(
        "Calendar read returned an unexpected payload"
      );
      expect(error.retryable).toBe(true);
      expect(error.status).toBeUndefined();
    });

    it("should fail the read when a matching entry has no usable date", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(
        monthResp([item({ date: "2026-10-06T00:00" })])
      );

      // Act
      const error = await findCalendarEntries("1711500235", "2026-10-06").catch(
        (e) => e
      );

      // Assert
      expect(error.message).toBe(
        "Calendar read returned an unexpected payload"
      );
    });

    it("should keep the status of a failed read through the envelope", async () => {
      // Arrange
      seedTokens();
      fetch.mockResolvedValueOnce(textResp("busy", false, 503));
      const sendResponse = vi.fn();

      // Act
      externalCb(
        {
          action: "calendar-find",
          workoutId: "1711500235",
          date: "2026-10-06",
        },
        SPA_SENDER,
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: "Calendar read failed: 503",
        status: 503,
      });
    });

    it.each([
      [{ action: "calendar-find", workoutId: "12a", date: "2026-10-06" }],
      [
        {
          action: "calendar-find",
          workoutId: "01711500235",
          date: "2026-10-06",
        },
      ],
      [{ action: "calendar-find", workoutId: 1711500235, date: "2026-10-06" }],
      [{ action: "calendar-find", workoutId: "1", date: "2026-02-30" }],
      [{ action: "calendar-find", workoutId: "1" }],
    ])("should refuse invalid input %j before any fetch", async (message) => {
      // Arrange
      seedTokens();

      // Act
      const error = await handleAction(message).catch((e) => e);

      // Assert
      expect(error.message).toMatch(/^Invalid /);
      expect(error.retryable).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("calendar action deadline", () => {
    // Every hung request is recorded so teardown can settle it: a mint runs
    // on the untimed fetch and would otherwise stay in flight into the next
    // test, which would join it.
    let hung = [];
    // A fetch that never answers but, like the real one, rejects with the
    // signal's reason when its request is aborted.
    const hungFetch = (_url, init = {}) =>
      new Promise((resolve, reject) => {
        hung.push({ resolve, reject });
        init.signal?.addEventListener("abort", () =>
          reject(init.signal.reason)
        );
      });
    const isSso = (url) => url.startsWith("https://sso.garmin.com/");
    const isSchedule = (url) => url.includes("/workout-service/schedule/");
    const posts = () =>
      fetch.mock.calls.filter(
        ([url, init]) => isSchedule(url) && init?.method === "POST"
      );
    const ssoCalls = () => fetch.mock.calls.filter(([url]) => isSso(url));
    const settle = (promise) =>
      promise.then(
        () => null,
        (e) => e
      );
    const tracked = (promise) => {
      const state = { done: false, value: undefined };
      state.promise = promise.then(
        (value) => Object.assign(state, { done: true, value }),
        (value) => Object.assign(state, { done: true, value })
      );
      return state;
    };
    const ticketResp = () => textResp("<html>...ticket=ST-9-ABCdef...</html>");
    // The rest of a successful mint after the ticket hop.
    const mintTail = (url) =>
      url.includes("/preauthorized")
        ? Promise.resolve(textResp("oauth_token=T&oauth_token_secret=S"))
        : Promise.resolve(jsonResp({ access_token: "new", expires_in: 3600 }));
    const stubSigning = () => {
      vi.spyOn(globalThis.crypto.subtle, "importKey").mockResolvedValue({});
      vi.spyOn(globalThis.crypto.subtle, "sign").mockResolvedValue(
        new Uint8Array(20).buffer
      );
    };

    beforeEach(() => {
      hung = [];
      vi.useFakeTimers({
        toFake: ["setTimeout", "clearTimeout", "Date", "performance"],
      });
    });

    afterEach(async () => {
      hung.forEach(({ reject }) => reject(new TypeError("teardown")));
      await vi.advanceTimersByTimeAsync(0);
      vi.useRealTimers();
      vi.restoreAllMocks();
      fetch.mockReset();
    });

    it("should use a deadline below Chrome's 30 s pending-fetch limit", () => {
      // Arrange
      const chromeFetchLimitMs = 30000;

      // Act
      const margin = chromeFetchLimitMs - CALENDAR_DEADLINE_MS;

      // Assert
      expect(CALENDAR_DEADLINE_MS).toBe(25000);
      expect(CALENDAR_SEND_CUTOFF_MS).toBe(15000);
      expect(margin).toBeGreaterThan(0);
    });

    it("should end by D with no POST when a mint hop hangs", async () => {
      // Arrange
      fetch.mockImplementation(hungFetch);
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(error.retryable).toBe(true);
      expect(error.status).toBeUndefined();
      expect(posts()).toHaveLength(0);
    });

    it("should answer deadline-before-send when the token lifecycle aborts on its own", async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new DOMException("aborted", "AbortError"));

      // Act
      const error = await settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(error.retryable).toBe(true);
      expect(posts()).toHaveLength(0);
    });

    it("should refuse to start the POST once the send cut-off has passed", async () => {
      // Arrange
      stubSigning();
      chrome.storage.local.set({
        garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
        garminOAuth2: { access_token: "old", expires_at: 0 },
      });
      const lateRefresh = CALENDAR_SEND_CUTOFF_MS + 5000;
      fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(jsonResp({ access_token: "new", expires_in: 3600 })),
              lateRefresh
            )
          )
      );
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(lateRefresh);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(0);
    });

    it("should refuse the retry POST after a 401 once the send cut-off has passed", async () => {
      // Arrange
      stubSigning();
      seedTokens();
      const lateTicket = CALENDAR_SEND_CUTOFF_MS + 1000;
      fetch.mockImplementation((url) => {
        if (isSchedule(url)) {
          return Promise.resolve(textResp("Unauthorized", false, 401));
        }
        if (isSso(url)) {
          return new Promise((resolve) =>
            setTimeout(() => resolve(ticketResp()), lateTicket)
          );
        }
        return mintTail(url);
      });
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(lateTicket);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(1);
    });

    it("should still end by D when it joins another caller's untimed mint", async () => {
      // Arrange
      fetch.mockImplementation(hungFetch);
      const starter = settle(handleAction({ action: "list" }));
      await vi.advanceTimersByTimeAsync(0);
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(fetch).toHaveBeenCalledTimes(1);
      hung[0].resolve(textResp("<html>no ticket</html>"));
      expect((await starter).needsReauth).toBe(true);
    });

    it("should end by D when a 401 re-mint joins an untimed mint started by list", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation((url, init) => {
        if (isSso(url)) return hungFetch(url, init);
        return Promise.resolve(textResp("Unauthorized", false, 401));
      });
      const starter = settle(handleAction({ action: "list" }));
      await vi.advanceTimersByTimeAsync(0);
      const outcome = tracked(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);

      // Assert
      expect(outcome.done).toBe(true);
      expect(outcome.value.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(1);
      expect(ssoCalls()).toHaveLength(1);
      hung[0].resolve(textResp("<html>no ticket</html>"));
      expect((await starter).needsReauth).toBe(true);
    });

    it("should not fail a caller that joined the mint a calendar action started", async () => {
      // Arrange
      stubSigning();
      fetch.mockImplementation((url, init) => {
        if (isSso(url)) return hungFetch(url, init);
        if (url.includes("/workout-service/workouts")) {
          return Promise.resolve(jsonResp([{ workoutId: 7 }]));
        }
        return mintTail(url);
      });
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));
      await vi.advanceTimersByTimeAsync(0);
      const joiner = settle(handleAction({ action: "list" }));
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);

      // Act
      hung[0].resolve(ticketResp());
      await vi.advanceTimersByTimeAsync(0);

      // Assert
      expect((await outcome).message).toBe(DEADLINE_BEFORE_SEND);
      expect(await joiner).toBeNull();
      expect(ssoCalls()).toHaveLength(1);
      expect(ssoCalls()[0][1].signal).toBeUndefined();
      expect(posts()).toHaveLength(0);
    });

    it("should end by D with at most one POST when a 401 is followed by a hung re-mint", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation((url, init) =>
        isSchedule(url)
          ? Promise.resolve(textResp("Unauthorized", false, 401))
          : hungFetch(url, init)
      );
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_BEFORE_SEND);
      expect(posts()).toHaveLength(1);
    });

    it("should answer an ambiguous deadline when the retry POST after a 401 re-mint hangs", async () => {
      // Arrange
      stubSigning();
      seedTokens();
      let postCount = 0;
      fetch.mockImplementation((url, init) => {
        if (isSchedule(url)) {
          postCount += 1;
          return postCount === 1
            ? Promise.resolve(textResp("Unauthorized", false, 401))
            : hungFetch(url, init);
        }
        return isSso(url) ? Promise.resolve(ticketResp()) : mintTail(url);
      });
      const outcome = settle(scheduleWorkout("1707805999", "2026-09-29"));

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_EXCEEDED);
      expect(error.status).toBeUndefined();
      expect(posts()).toHaveLength(2);
    });

    it("should answer an ambiguous deadline with no status when the POST hangs after it was sent", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation(hungFetch);
      const sendResponse = vi.fn();
      externalCb(
        { action: "schedule", workoutId: "1707805999", date: "2026-09-29" },
        SPA_SENDER,
        sendResponse
      );

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);

      // Assert
      expect(posts()).toHaveLength(1);
      expect(posts()[0][1].signal.aborted).toBe(true);
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        protocolVersion: 1,
        error: DEADLINE_EXCEEDED,
        retryable: true,
      });
    });

    it("should end a hung calendar read by D with no status", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation(hungFetch);
      const outcome = settle(findCalendarEntries("1711500235", "2026-10-06"));

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS);
      const error = await outcome;

      // Assert
      expect(error.message).toBe(DEADLINE_EXCEEDED);
      expect(error.status).toBeUndefined();
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    });

    it("should not apply the send cut-off to the calendar read", async () => {
      // Arrange
      chrome.storage.local.set({
        garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
        garminOAuth2: { access_token: "old", expires_at: 0 },
      });
      stubSigning();
      const lateRefresh = CALENDAR_SEND_CUTOFF_MS + 5000;
      fetch.mockImplementation((url) =>
        url.includes("/calendar-service/")
          ? Promise.resolve(jsonResp({ calendarItems: [] }))
          : new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve(jsonResp({ access_token: "new", expires_in: 3600 })),
                lateRefresh
              )
            )
      );
      const outcome = findCalendarEntries("1711500235", "2026-10-06");

      // Act
      await vi.advanceTimersByTimeAsync(lateRefresh);

      // Assert
      expect(await outcome).toEqual([]);
    });

    it("should not answer before D while the POST is still in flight", async () => {
      // Arrange
      seedTokens();
      fetch.mockImplementation(hungFetch);
      const sendResponse = vi.fn();
      externalCb(
        { action: "schedule", workoutId: "1707805999", date: "2026-09-29" },
        SPA_SENDER,
        sendResponse
      );

      // Act
      await vi.advanceTimersByTimeAsync(CALENDAR_DEADLINE_MS - 1);

      // Assert
      expect(sendResponse).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(sendResponse).toHaveBeenCalled();
    });
  });
});
