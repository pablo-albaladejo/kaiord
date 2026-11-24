import { describe, it, expect, beforeEach, vi } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  isAllowed,
  checkSession,
  request,
  handleAction,
  EXTERNAL_ACTIONS,
} = require("../background.js");
const pkg = require("../package.json");

// External senders are origin-pinned by the vendored envelope guard; the
// positive paths use an allowed SPA origin, the negative paths a foreign one.
const FOREIGN_ORIGIN = "https://attacker.example";

const EXPECTED_PROTOCOL_VERSION = 2;
const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;
const OPAQUE_REDIRECT_STATUS = 0;
const ONE_HOUR_SECONDS = 3600;

const ATHLETE_ID = 900123;
const WEIGHT_TYPE = 9;
const WEIGHT_KG = 80.5;
const START_DATE = "2026-07-01";
const END_DATE = "2026-07-07";
const TOKEN_URL = "https://tpapi.trainingpeaks.com/users/v3/token";
const METRICS_URL = `https://tpapi.trainingpeaks.com/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetrics/${START_DATE}/${END_DATE}`;
const METRICS_PATH = `/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetrics/${START_DATE}/${END_DATE}`;
const readMetrics = () =>
  request({ action: "request", method: "GET", path: METRICS_PATH });
const WORKOUT_WRITE_URL = `https://tpapi.trainingpeaks.com/fitness/v6/athletes/${ATHLETE_ID}/workouts`;

// A distinctive token value asserted to never reach a console sink.
const SECRET_TOKEN = "SECRET-ACCESS-TOKEN-9f0a1c";
const METRICS_BODY = [
  {
    timeStamp: "2026-07-01T07:30:00Z",
    details: [{ type: WEIGHT_TYPE, value: WEIGHT_KG }],
  },
];

// Listener callbacks captured at import time; __resetChromeMock clears the
// mock call log in beforeEach, so grab them once at module scope.
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];

// Cookie-only token-exchange Response double (read by cookieSessionFetch:
// .type/.redirected/.status/.ok/.headers.get/.text()).
const tokenResponse = (payload, { status = HTTP_OK, type = "basic" } = {}) => ({
  ok: status >= HTTP_OK && status < 300,
  status,
  type,
  redirected: false,
  headers: { get: () => "application/json" },
  text: () => Promise.resolve(JSON.stringify(payload)),
});
const opaqueRedirectResponse = () => ({
  ok: false,
  status: OPAQUE_REDIRECT_STATUS,
  type: "opaqueredirect",
  redirected: false,
  headers: { get: () => "" },
  text: () => Promise.resolve(""),
});
// Bearer data Response double (read by bearerFetch: .ok/.status/.json/.text()).
const jsonResp = (obj, ok = true, status = HTTP_OK) => ({
  ok,
  status,
  json: () => Promise.resolve(obj),
  text: () => Promise.resolve(JSON.stringify(obj)),
});
const textResp = (body, ok = true, status = HTTP_OK) => ({
  ok,
  status,
  text: () => Promise.resolve(body),
});

// Seed a valid cached access token so the Bearer path skips the exchange.
const seedToken = (accessToken = "bear") =>
  chrome.storage.local.set({
    tpAccessToken: {
      accessToken,
      expiresAt: Math.floor(Date.now() / 1000) + ONE_HOUR_SECONDS,
      athleteId: ATHLETE_ID,
    },
  });

const tokenPayload = (accessToken = "tok") => ({
  success: true,
  token: { access_token: accessToken, expires_in: ONE_HOUR_SECONDS },
  athleteId: ATHLETE_ID,
});

describe("background.js", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  describe("PROTOCOL_VERSION", () => {
    it("should be 2", () => {
      // Arrange
      const expected = EXPECTED_PROTOCOL_VERSION;

      // Act
      const actual = PROTOCOL_VERSION;

      // Assert
      expect(actual).toBe(expected);
    });
  });

  describe("BRIDGE_MANIFEST", () => {
    it("should have the pinned trainingpeaks-bridge shape", () => {
      // Arrange
      const expected = {
        id: "trainingpeaks-bridge",
        name: "TrainingPeaks",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:body", "write:workouts"],
      };

      // Act
      const actual = BRIDGE_MANIFEST;

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should match the package.json version (no publish drift)", () => {
      // Arrange
      const expected = pkg.version;

      // Act
      const actual = BRIDGE_MANIFEST.version;

      // Assert
      expect(actual).toBe(expected);
    });
  });

  describe("EXTERNAL_ACTIONS origin pinning", () => {
    it("should expose exactly the probe, the request and the athlete id read", () => {
      // Arrange
      const expected = [
        "ping",
        "checkSession",
        "request",
        "read-athlete-id",
        "open-trainingpeaks",
        "set-theme",
      ];

      // Act
      const actual = [...EXTERNAL_ACTIONS];

      // Assert
      expect(actual).toEqual(expected);
    });

    it.each([
      { label: "a foreign origin", origin: FOREIGN_ORIGIN },
      { label: "a kaiord.com subdomain", origin: "https://app.kaiord.com" },
      { label: "the www host", origin: "https://www.kaiord.com" },
      {
        label: "a dev port in a packaged build",
        origin: "http://localhost:5173",
      },
      { label: "an empty sender", origin: undefined },
    ])("should give no answer to $label", async ({ origin }) => {
      // Arrange
      const sendResponse = vi.fn();
      const sender = origin === undefined ? {} : { origin };

      // Act
      const keepsChannelOpen = externalCb(
        { action: "request", method: "GET", path: METRICS_PATH },
        sender,
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(keepsChannelOpen).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("isAllowed", () => {
    it("should never list the token endpoint, whose answer is the token", () => {
      // Arrange
      const path = "/users/v3/token";

      // Act
      const allowed = ["GET", "POST"].map((m) => isAllowed(m, path));

      // Assert
      expect(allowed).toEqual([false, false]);
    });

    it("should allow the metrics range read and refuse a metric write", () => {
      // Arrange
      const writePath = `/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetric`;

      // Act
      const results = [
        isAllowed("GET", METRICS_PATH),
        isAllowed("POST", writePath),
      ];

      // Assert
      expect(results).toEqual([true, false]);
    });

    it("should allow only the single-workout read, not a range or a delete", () => {
      // Arrange
      const base = `/fitness/v6/athletes/${ATHLETE_ID}/workouts`;

      // Act
      const results = [
        isAllowed("GET", `${base}/4242`),
        isAllowed("GET", `${base}/2026-11-01/2026-11-30`),
        isAllowed("DELETE", `${base}/4242`),
        isAllowed("PUT", `${base}/4242`),
      ];

      // Assert
      expect(results).toEqual([true, false, false, false]);
    });

    it("should deny method mismatches and look-alike paths", () => {
      // Arrange
      const probes = [
        ["GET", "/metrics/v3/athletes/abc/consolidatedtimedmetrics/x/y"],
        ["GET", `/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetric`],
        ["POST", "/metrics/v3/athletes/1/consolidatedtimedmetric/extra"],
        ["GET", "/users/v3/token-all"],
      ];

      // Act
      const results = probes.map(([method, path]) => isAllowed(method, path));

      // Assert
      expect(results).toEqual([false, false, false, false]);
    });
  });

  describe("request token-exchange → Bearer flow", () => {
    const raw = (body) => ({
      status: HTTP_OK,
      contentType: "",
      body: JSON.stringify(body),
    });

    it("should exchange the cookie for a token then call the metrics API with the Bearer", async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce(tokenResponse(tokenPayload("tok")))
        .mockResolvedValueOnce(jsonResp(METRICS_BODY));

      // Act
      const result = await readMetrics();

      // Assert
      expect(result).toEqual(raw(METRICS_BODY));
      const [tokenCall, dataCall] = fetch.mock.calls;
      expect(tokenCall[0]).toBe(TOKEN_URL);
      expect(tokenCall[1].credentials).toBe("include");
      expect(tokenCall[1].headers.Authorization).toBeUndefined();
      expect(dataCall[0]).toBe(METRICS_URL);
      expect(dataCall[1].credentials).toBe("omit");
      expect(dataCall[1].headers.Authorization).toBe("Bearer tok");
    });

    it("should reuse a cached token without re-exchanging the cookie", async () => {
      // Arrange
      await seedToken("bear");
      fetch.mockResolvedValueOnce(jsonResp(METRICS_BODY));

      // Act
      const result = await readMetrics();

      // Assert
      expect(result).toEqual(raw(METRICS_BODY));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toBe(METRICS_URL);
      expect(fetch.mock.calls[0][1].headers.Authorization).toBe("Bearer bear");
    });

    it("should re-exchange the cookie once on a 401 then retry the Bearer call", async () => {
      // Arrange
      await seedToken("stale");
      fetch
        .mockResolvedValueOnce(textResp("nope", false, HTTP_UNAUTHORIZED))
        .mockResolvedValueOnce(tokenResponse(tokenPayload("reminted")))
        .mockResolvedValueOnce(jsonResp(METRICS_BODY));

      // Act
      const result = await readMetrics();

      // Assert
      expect(result).toEqual(raw(METRICS_BODY));
      const authHeaders = fetch.mock.calls.map(
        (call) => call[1]?.headers?.Authorization
      );
      expect(authHeaders[0]).toBe("Bearer stale");
      expect(authHeaders[2]).toBe("Bearer reminted");
    });

    it("should reject with needsReauth when a redirect kills the token exchange", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const attempt = readMetrics();

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });

    it("should not report a server error on the token exchange as a revoked sign-in", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(tokenResponse({}, { status: 500 }));

      // Act
      const error = await readMetrics().catch((e) => e);

      // Assert
      expect(error.needsReauth).toBeUndefined();
      expect(error.status).toBe(500);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should relay a workout's structure as the string it was given, never re-encoded", async () => {
      // Arrange
      await seedToken("bear");
      const workout = {
        athleteId: ATHLETE_ID,
        workoutId: 0,
        workoutDay: "2026-09-07",
        title: "Threshold",
        description: null,
        workoutTypeValueId: 2,
        totalTimePlanned: 1,
        publicSettingValue: 0,
        structure: '{"structure":[]}',
      };
      fetch.mockResolvedValueOnce(jsonResp({ workoutId: 1 }));

      // Act
      await request({
        action: "request",
        method: "POST",
        path: `/fitness/v6/athletes/${ATHLETE_ID}/workouts`,
        body: workout,
      });

      // Assert
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(WORKOUT_WRITE_URL);
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body);
      expect(body.structure).toBe('{"structure":[]}');
    });
  });

  describe("checkSession", () => {
    it("should report not-checked and make no request when no token is held", async () => {
      // Arrange
      const before = fetch.mock.calls.length;

      // Act
      const result = await checkSession();

      // Assert
      expect(result.session).toBe("not-checked");
      expect(result.authenticated).toBe(false);
      expect(fetch.mock.calls.length).toBe(before);
      expect(result).toMatchObject({
        id: "trainingpeaks-bridge",
        name: "TrainingPeaks",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:body", "write:workouts"],
      });
    });

    it("should report signed-in while a token a real request minted is still valid", async () => {
      // Arrange
      await chrome.storage.local.set({
        tpAccessToken: {
          accessToken: SECRET_TOKEN,
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
          athleteId: ATHLETE_ID,
        },
      });

      // Act
      const result = await checkSession();

      // Assert
      expect(result.session).toBe("signed-in");
      expect(result.authenticated).toBe(true);
      expect(result.athleteId).toBeUndefined();
      expect(JSON.stringify(result)).not.toContain(SECRET_TOKEN);
    });

    it("should report not-checked once the held token has expired", async () => {
      // Arrange
      await chrome.storage.local.set({
        tpAccessToken: {
          accessToken: SECRET_TOKEN,
          expiresAt: Math.floor(Date.now() / 1000) - 1,
          athleteId: ATHLETE_ID,
        },
      });

      // Act
      const result = await checkSession();

      // Assert
      expect(result.session).toBe("not-checked");
    });
  });

  describe("readAthleteId", () => {
    it("should mint the token and answer only the athlete id", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(tokenResponse(tokenPayload(SECRET_TOKEN)));

      // Act
      const result = await handleAction({ action: "read-athlete-id" });

      // Assert
      expect(result).toEqual({ athleteId: ATHLETE_ID });
    });

    it("should carry needsReauth when TrainingPeaks says the session is dead", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const attempt = handleAction({ action: "read-athlete-id" });

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });
  });

  describe("handleAction", () => {
    it("should reject an unknown action", async () => {
      // Arrange
      const message = { action: "delete-everything" };

      // Act
      const attempt = handleAction(message);

      // Assert
      await expect(attempt).rejects.toThrow(
        "Unknown action: delete-everything"
      );
    });

    it("should route open-trainingpeaks to a new tab", async () => {
      // Arrange
      chrome.tabs.create.mockResolvedValue({ id: 7 });

      // Act
      const result = await handleAction({ action: "open-trainingpeaks" });

      // Assert
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: "https://app.trainingpeaks.com/",
      });
      expect(result).toBeNull();
    });
  });

  describe("credential safety", () => {
    it("should never write the access token to any console sink", async () => {
      // Arrange
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      fetch
        .mockResolvedValueOnce(tokenResponse(tokenPayload(SECRET_TOKEN)))
        .mockResolvedValueOnce(jsonResp(METRICS_BODY));

      // Act
      await readMetrics();

      // Assert
      const logged = [
        ...logSpy.mock.calls,
        ...errorSpy.mock.calls,
        ...warnSpy.mock.calls,
      ]
        .flat()
        .join(" ");
      expect(logged).not.toContain(SECRET_TOKEN);
      logSpy.mockRestore();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });
});

describe("set-theme (the app's theme preference for the popup)", () => {
  const sendExternal = (message, origin) =>
    new Promise((resolve) => externalCb(message, { origin }, resolve));

  beforeEach(() => __resetChromeMock());

  it("should store a valid preference sent from a Kaiord origin", async () => {
    // Arrange
    const message = { action: "set-theme", theme: "light" };

    // Act
    const response = await sendExternal(message, "https://kaiord.com");

    // Assert
    expect(response).toMatchObject({ ok: true, data: null });
    expect(__chromeLocalStore.kaiordTheme).toBe("light");
  });

  it("should store nothing and give no answer to a preference sent from a kaiord.com subdomain", async () => {
    // Arrange
    const message = { action: "set-theme", theme: "dark" };
    const sendResponse = vi.fn();

    // Act
    const keepsChannelOpen = externalCb(
      message,
      { origin: "https://app.kaiord.com" },
      sendResponse
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(keepsChannelOpen).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
    expect(__chromeLocalStore.kaiordTheme).toBeUndefined();
  });

  it("should refuse a value outside light, dark and system", async () => {
    // Arrange
    const message = { action: "set-theme", theme: "sepia" };

    // Act
    const response = await sendExternal(message, "https://kaiord.com");

    // Assert
    expect(response).toMatchObject({
      ok: false,
      error: "Invalid theme preference",
      retryable: false,
    });
    expect(__chromeLocalStore.kaiordTheme).toBeUndefined();
  });
});
