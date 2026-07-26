const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  TRAIN2GO_ORIGIN,
  EXTERNAL_ACTIONS,
  isAllowed,
  handleAction,
  train2goFetch,
  ping,
  readWeek,
  readDetails,
  openTrain2Go,
  logSwallowed,
  TELEMETRY_KEY,
} = require("../background.js");
const parser = require("../parser.js");
const pkg = require("../package.json");

// Listener callbacks are captured at import time; __resetChromeMock clears
// the mock call log in beforeEach, so grab them once at module scope.
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const EXPECTED_PROTOCOL_VERSION = 1;
const HTTP_OK = 200;
const HTTP_MULTIPLE_CHOICES = 300;
const HTTP_FOUND = 302;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const HTTP_SERVER_ERROR = 500;
const OPAQUE_REDIRECT_STATUS = 0;
const USER_ID = 28035;
const WEEK_ACTIVITY_ID = 123;
const DAY_ACTIVITY_ID = 9001;

const PING_DATE = "2026-04-13";

// Minimal Response doubles for the SW `fetch(url, init)` call.
// cookieSessionFetch reads .type/.redirected/.status/.ok/.headers.get/.text().
const jsonResponse = (payload, status = HTTP_OK) => ({
  ok: status >= HTTP_OK && status < HTTP_MULTIPLE_CHOICES,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => "application/json" },
  text: () => Promise.resolve(JSON.stringify(payload)),
});
const htmlResponse = (body, status = HTTP_OK) => ({
  ok: status >= HTTP_OK && status < HTTP_MULTIPLE_CHOICES,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => "text/html" },
  text: () => Promise.resolve(body),
});
const opaqueRedirectResponse = () => ({
  ok: false,
  status: OPAQUE_REDIRECT_STATUS,
  type: "opaqueredirect",
  redirected: false,
  headers: { get: () => "" },
  text: () => Promise.resolve(""),
});
const statusResponse = (status) => ({
  ok: false,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => "" },
  text: () => Promise.resolve(""),
});

describe("background service worker (SW-direct)", () => {
  beforeEach(() => __resetChromeMock());
  // Restore any vi.spyOn() patches (e.g. the parsePingJson stub) so a failing
  // assertion never leaks a stub into a sibling test.
  afterEach(() => vi.restoreAllMocks());

  describe("BRIDGE_MANIFEST", () => {
    it("should have the pinned train2go-bridge shape", () => {
      // Arrange
      const expected = {
        id: "train2go-bridge",
        name: "Kaiord Train2Go Bridge",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:training-plan", "read:training-zones"],
      };

      // Act
      const actual = BRIDGE_MANIFEST;

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should expose protocolVersion 1", () => {
      // Arrange
      const expected = EXPECTED_PROTOCOL_VERSION;

      // Act
      const actual = PROTOCOL_VERSION;

      // Assert
      expect(actual).toBe(expected);
    });

    it("should match the package.json version (no publish drift)", () => {
      // Arrange
      const expected = pkg.version;

      // Act
      const actual = BRIDGE_MANIFEST.version;

      // Assert
      expect(actual).toBe(expected);
    });

    it("should validate against the replica SPA manifest contract", () => {
      // Arrange
      const validate = makeManifestValidator();

      // Act
      const errors = validate(BRIDGE_MANIFEST);

      // Assert
      expect(errors).toEqual([]);
    });

    it("should reject malformed manifests (not a pass-everything stub)", () => {
      // Arrange
      const validate = makeManifestValidator();

      // Act
      const badCapability = validate({
        ...BRIDGE_MANIFEST,
        capabilities: ["bogus"],
      });
      const badProtocol = validate({ ...BRIDGE_MANIFEST, protocolVersion: 0 });
      const badId = validate({ ...BRIDGE_MANIFEST, id: 42 });

      // Assert
      expect(badCapability).toEqual(
        expect.arrayContaining([expect.stringMatching(/not in allowed enum/)])
      );
      expect(badProtocol).toEqual(
        expect.arrayContaining([expect.stringMatching(/protocolVersion/)])
      );
      expect(badId).toEqual(
        expect.arrayContaining([expect.stringMatching(/id must be string/)])
      );
    });
  });

  function makeManifestValidator() {
    const ALLOWED_CAPABILITIES = new Set([
      "read:workouts",
      "write:workouts",
      "read:body",
      "read:sleep",
      "read:training-plan",
      "read:training-zones",
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
    it("should allow GET /api/v2/profile/ping", () => {
      // Arrange
      const method = "GET";

      // Act
      const allowed = isAllowed(method, "/api/v2/profile/ping");

      // Assert
      expect(allowed).toBe(true);
    });

    it("should allow GET weekly with a user param", () => {
      // Arrange
      const path = "/api/v2/workplan/weekly/2026-04-13?user=28035";

      // Act
      const allowed = isAllowed("GET", path);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should allow GET daily with user and source params", () => {
      // Arrange
      const path = "/api/v2/workplan/daily/2026-04-13?user=28035&source=sidebar";

      // Act
      const allowed = isAllowed("GET", path);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should allow GET the server-rendered /user/details page", () => {
      // Arrange
      const path = "/user/details";

      // Act
      const allowed = isAllowed("GET", path);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should deny disallowed paths, non-GET methods, and injection attempts", () => {
      // Arrange
      const cases = [
        ["GET", "/api/v2/activities/17722582"],
        ["POST", "/api/v2/profile/ping"],
        ["DELETE", "/api/v2/profile/ping"],
        ["GET", "/api/v2/workplan/weekly/2026-04-13?admin=true"],
        ["GET", "/api/v2/workplan/weekly/../../admin/users"],
        ["GET", "/api/v2/workplan/weekly/abc"],
      ];

      // Act
      const results = cases.map(([method, path]) => isAllowed(method, path));

      // Assert
      expect(results).toEqual([false, false, false, false, false, false]);
    });
  });

  describe("train2goFetch", () => {
    it("should fetch the pinned origin with the cookie session and manual redirect", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      // Act
      const res = await train2goFetch("/api/v2/profile/ping");

      // Assert
      expect(res).toEqual({ ok: true, status: HTTP_OK, data: { success: true } });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(`${TRAIN2GO_ORIGIN}/api/v2/profile/ping`);
      expect(init.credentials).toBe("include");
      expect(init.redirect).toBe("manual");
    });

    it("should reject a disallowed path without fetching", async () => {
      // Arrange
      const path = "/api/v2/admin/users";

      // Act
      const res = await train2goFetch(path);

      // Assert
      expect(res).toEqual({
        ok: false,
        error: "Blocked: disallowed path or method",
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should return the raw HTML body for a text/html response", async () => {
      // Arrange
      const body = "<main>details</main>";
      fetch.mockResolvedValueOnce(htmlResponse(body));

      // Act
      const res = await train2goFetch("/user/details");

      // Assert
      expect(res).toEqual({ ok: true, status: HTTP_OK, data: body });
    });

    it("should surface needsReauth on an opaqueredirect (dead session)", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const res = await train2goFetch("/api/v2/profile/ping");

      // Assert
      expect(res).toMatchObject({ ok: false, needsReauth: true });
    });

    it("should surface needsReauth on a 3xx redirect", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(statusResponse(HTTP_FOUND));

      // Act
      const res = await train2goFetch("/api/v2/profile/ping");

      // Assert
      expect(res).toMatchObject({ ok: false, needsReauth: true });
    });

    it("should surface needsReauth on a 401 or 403 auth challenge", async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce(statusResponse(HTTP_UNAUTHORIZED))
        .mockResolvedValueOnce(statusResponse(HTTP_FORBIDDEN));

      // Act
      const unauthorized = await train2goFetch("/api/v2/profile/ping");
      const forbidden = await train2goFetch("/api/v2/profile/ping");

      // Assert
      expect(unauthorized).toMatchObject({ ok: false, needsReauth: true });
      expect(forbidden).toMatchObject({ ok: false, needsReauth: true });
    });

    it("should return a plain failure (no needsReauth) on a 500", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(statusResponse(HTTP_SERVER_ERROR));

      // Act
      const res = await train2goFetch("/api/v2/profile/ping");

      // Assert
      expect(res).toMatchObject({ ok: false, status: HTTP_SERVER_ERROR });
      expect(res.needsReauth).toBeUndefined();
    });
  });

  describe("handleAction", () => {
    it("should return the live session on ping", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { user: { id: USER_ID, name: "Pablo" } },
        })
      );

      // Act
      const result = await handleAction({ action: "ping" });

      // Assert
      expect(result).toMatchObject({
        id: "train2go-bridge",
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:training-plan", "read:training-zones"],
        userId: USER_ID,
        userName: "Pablo",
        sessionActive: true,
      });
    });

    it("should return the manifest with sessionActive false when the session is dead", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const result = await handleAction({ action: "ping" });

      // Assert
      expect(result).toMatchObject({
        id: "train2go-bridge",
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:training-plan", "read:training-zones"],
        sessionActive: false,
      });
    });

    it("should let manifest fields win if parsePingJson ever returns colliding keys", async () => {
      // Arrange
      // Symmetric defense to the garmin-bridge precedence test: a
      // parsePingJson regression that passed arbitrary keys through must not
      // be able to spoof the manifest identity. Reverting ping()'s spread to
      // `{ ...BRIDGE_MANIFEST, ...session }` makes this fail.
      const ATTACKER_SESSION = {
        id: "ATTACKER",
        name: "Fake Bridge",
        version: "99.9.9",
        protocolVersion: 999,
        capabilities: ["write:workouts"],
        userId: USER_ID,
        userName: "Pablo",
        sessionActive: true,
      };
      vi.spyOn(parser, "parsePingJson").mockReturnValue(ATTACKER_SESSION);
      fetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      // Act
      const result = await handleAction({ action: "ping" });

      // Assert
      expect(result).toMatchObject({
        id: "train2go-bridge",
        name: "Kaiord Train2Go Bridge",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:training-plan", "read:training-zones"],
        sessionActive: true,
        userId: USER_ID,
        userName: "Pablo",
      });
    });

    it("should parse the weekly activities on read-week", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(
        jsonResponse({
          data: {
            replace: {
              "#workplan":
                '<div class="workplan-table-block workplan-table-day workplan-table-date-2026-04-13 remote-sidebar"><div class="activity" data-status="0" data-id="123"><figure class="icon icon-sportscycling"></figure><span class="measured">1 h</span><div class="workload workload-default" data-value="2"></div><a href="#" title="Test Ride"></a></div></div>',
            },
          },
        })
      );

      // Act
      const result = await handleAction({
        action: "read-week",
        date: PING_DATE,
        userId: USER_ID,
      });

      // Assert
      expect(result.activities).toHaveLength(1);
      expect(result.activities[0]).toMatchObject({
        id: WEEK_ACTIVITY_ID,
        date: PING_DATE,
        sport: "cycling",
        title: "Test Ride",
      });
    });

    it("should require userId for read-week", async () => {
      // Arrange
      const message = { action: "read-week", date: PING_DATE };

      // Act
      const attempt = handleAction(message);

      // Assert
      await expect(attempt).rejects.toThrow("Missing userId");
    });

    it("should require userId for read-day", async () => {
      // Arrange
      const message = { action: "read-day", date: PING_DATE };

      // Act
      const attempt = handleAction(message);

      // Assert
      await expect(attempt).rejects.toThrow("Missing userId");
    });

    it("should backfill the date param onto every parsed activity from read-day", async () => {
      // Arrange
      // The daily HTML fragment lacks a date anchor; without backfill,
      // expandDay would upsert records with date:"" and the activity would
      // drop out of every per-day calendar bucket. Regression for that bug.
      const html = `<div data-id="9001" data-status="0" class="activity activity-default">
        <span class="activity-title"><strong>Test workout</strong></span>
        <figure class="icon-sportscycling"></figure>
        <span class="measured">60min</span>
        <span class="workload-default" data-value="3"></span>
      </div>`;
      fetch.mockResolvedValueOnce(jsonResponse({ data: { content: html } }));

      // Act
      const result = await handleAction({
        action: "read-day",
        date: "2026-05-07",
        userId: USER_ID,
      });

      // Assert
      expect(result.activities).toHaveLength(1);
      expect(result.activities[0]).toMatchObject({
        id: DAY_ACTIVITY_ID,
        date: "2026-05-07",
      });
    });

    it("should return an empty comments array from read-day when the day has no thread", async () => {
      // Arrange
      const html = `<div data-id="9002" data-status="0" class="activity activity-default">
        <span class="activity-title"><strong>No comments here</strong></span>
        <figure class="icon-sportscycling"></figure>
        <span class="measured">60min</span>
      </div>`;
      fetch.mockResolvedValueOnce(jsonResponse({ data: { content: html } }));

      // Act
      const result = await handleAction({
        action: "read-day",
        date: "2026-05-07",
        userId: USER_ID,
      });

      // Assert
      expect(result.comments).toEqual([]);
    });

    it("should return the parsed day comment thread alongside activities", async () => {
      // Arrange
      const html =
        `<div data-id="9003" data-status="0" class="activity activity-default">` +
        `<span class="activity-title"><strong>Race</strong></span>` +
        `<figure class="icon-sportsrunning"></figure>` +
        `<span class="measured">90min</span></div>` +
        `<div class="comments "><div class="comment" id="c1">` +
        `<picture class="image" title="Coach Dani"></picture>` +
        `<div class="content">` +
        `<time datetime="2026-06-08 13:02:21">Mon</time>` +
        `<p>Great race!</p></div></div></div>`;
      fetch.mockResolvedValueOnce(jsonResponse({ data: { content: html } }));

      // Act
      const result = await handleAction({
        action: "read-day",
        date: "2026-06-07",
        userId: USER_ID,
      });

      // Assert
      expect(result.activities).toHaveLength(1);
      expect(result.comments).toEqual([
        {
          author: "Coach Dani",
          isOwn: false,
          timestamp: "2026-06-08 13:02:21",
          text: "Great race!",
        },
      ]);
    });

    it("should parse the details HTML body into a ZonesPayload on read-details", async () => {
      // Arrange
      const html = `<main><section><div id="physio-99999" class="details-physio"><form>
        <input name="weight" type="number" value="83">
        <input name="bpm_max" type="number" value="187">
      </form></div></section></main>`;
      fetch.mockResolvedValueOnce(htmlResponse(html));

      // Act
      const result = await handleAction({ action: "read-details" });

      // Assert
      expect(result.physiological).toEqual({ weight: 83, bpmMax: 187 });
    });

    it("should throw needsReauth from read-details when the session is dead", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const attempt = handleAction({ action: "read-details" });

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });

    it("should open the Train2Go dashboard tab on open-train2go", async () => {
      // Arrange
      const expectedUrl = "https://app.train2go.com/user/index";

      // Act
      await handleAction({ action: "open-train2go" });

      // Assert
      expect(chrome.tabs.create).toHaveBeenCalledWith({ url: expectedUrl });
    });

    it("should reject an unknown action", async () => {
      // Arrange
      const message = { action: "unknown" };

      // Act
      const attempt = handleAction(message);

      // Assert
      await expect(attempt).rejects.toThrow("Unknown action: unknown");
    });
  });

  describe("external dispatch origin pinning", () => {
    it("should expose exactly the bridge action surface", () => {
      // Arrange
      const expected = [
        "ping",
        "read-week",
        "read-day",
        "read-details",
        "open-train2go",
        "profile-snapshot",
        "profile-snapshot-clear",
      ];

      // Act
      const actual = [...EXTERNAL_ACTIONS];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should reject a foreign origin without invoking fetch", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb(
        { action: "read-week", date: PING_DATE, userId: USER_ID },
        { origin: "https://attacker.example" },
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(fetch).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });

    it("should reject an empty sender for an allowlisted action", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb({ action: "ping" }, {}, sendResponse);
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(fetch).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: "Origin or action not permitted",
        })
      );
    });

    it("should wrap a ping in the SPA envelope for an allowed origin", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());
      const sendResponse = vi.fn();

      // Act
      externalCb(
        { action: "ping" },
        { origin: "https://app.kaiord.com" },
        sendResponse
      );
      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

      // Assert
      expect(sendResponse.mock.calls[0][0]).toMatchObject({
        ok: true,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        data: { id: "train2go-bridge", sessionActive: false },
      });
    });
  });

  describe("credential safety", () => {
    it("should never write the session response body to any console sink", async () => {
      // Arrange
      const secret = "SECRET-ATHLETE-NAME-0f9a1c";
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      fetch.mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { user: { id: USER_ID, name: secret } },
        })
      );

      // Act
      await ping();

      // Assert
      const logged = [
        ...logSpy.mock.calls,
        ...errorSpy.mock.calls,
        ...warnSpy.mock.calls,
      ]
        .flat()
        .join(" ");
      expect(logged).not.toContain(secret);
    });
  });

  describe("swallowed-error telemetry", () => {
    it("should record a structured entry when a ping network call throws", async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error("network down"));

      // Act
      await ping();

      // Assert
      await vi.waitFor(() => {
        const log = __chromeLocalStore[TELEMETRY_KEY];
        expect(log).toHaveLength(1);
        expect(log[0]).toMatchObject({
          level: "warn",
          action: "ping",
          cause: "network down",
        });
        expect(log[0].at).toEqual(expect.any(Number));
      });
    });

    it("should record a structured entry (level, action, cause, timestamp)", async () => {
      // Arrange
      const cause = new Error("boom");

      // Act
      await logSwallowed("error", "load-parser", cause);

      // Assert
      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toEqual([
        {
          level: "error",
          action: "load-parser",
          cause: "boom",
          at: expect.any(Number),
        },
      ]);
    });

    it("should cap the log to the most recent 25 entries", async () => {
      // Arrange
      const total = 30;
      const cap = 25;

      // Act
      for (let i = 0; i < total; i += 1) {
        await logSwallowed("warn", "ping", `err-${i}`);
      }

      // Assert
      const log = __chromeLocalStore[TELEMETRY_KEY];
      expect(log).toHaveLength(cap);
      expect(log[0].cause).toBe("err-5");
      expect(log[cap - 1].cause).toBe("err-29");
    });
  });

  describe("internal onMessage listener", () => {
    it("should return true to keep the internal response channel open", () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      const result = internalCb({ action: "ping" }, {}, sendResponse);

      // Assert
      expect(result).toBe(true);
    });
  });
});
