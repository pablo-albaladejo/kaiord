import { describe, it, expect, beforeEach, vi } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  isAllowed,
  tpFetch,
  checkSession,
  readMetrics,
  pushWeight,
  handleAction,
  EXTERNAL_ACTIONS,
} = require("../background.js");
const pkg = require("../package.json");

// External senders are origin-pinned by the vendored envelope guard; the
// positive paths use an allowed SPA origin, the negative paths a foreign one.
const SPA_ORIGIN = "https://app.kaiord.com";
const FOREIGN_ORIGIN = "https://attacker.example";
const SPA_SENDER = { origin: SPA_ORIGIN };

const EXPECTED_PROTOCOL_VERSION = 1;
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
const METRIC_WRITE_URL = `https://tpapi.trainingpeaks.com/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetric`;

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
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

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
    it("should be 1", () => {
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
        capabilities: ["read:body", "write:body"],
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
    it("should expose exactly the probe + read + write surface", () => {
      // Arrange
      const expected = [
        "ping",
        "checkSession",
        "read-metrics",
        "push-weight",
        "open-trainingpeaks",
      ];

      // Act
      const actual = [...EXTERNAL_ACTIONS];

      // Assert
      expect(actual).toEqual(expected);
    });

    it("should reject a foreign origin without invoking the handler", async () => {
      // Arrange
      const sendResponse = vi.fn();

      // Act
      externalCb(
        { action: "read-metrics", start: START_DATE, end: END_DATE },
        { origin: FOREIGN_ORIGIN },
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
  });

  describe("isAllowed", () => {
    it("should allow the cookie-only token endpoint", () => {
      // Arrange
      const path = "/users/v3/token";

      // Act
      const allowed = isAllowed("GET", path);

      // Assert
      expect(allowed).toBe(true);
    });

    it("should allow the metrics range read and single-metric write", () => {
      // Arrange
      const readPath = `/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetrics/${START_DATE}/${END_DATE}`;
      const writePath = `/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetric`;

      // Act
      const results = [
        isAllowed("GET", readPath),
        isAllowed("POST", writePath),
      ];

      // Assert
      expect(results).toEqual([true, true]);
    });

    it("should deny method mismatches and look-alike paths", () => {
      // Arrange
      const probes = [
        ["POST", "/users/v3/token"],
        ["GET", "/metrics/v3/athletes/abc/consolidatedtimedmetrics/x/y"],
        ["GET", `/metrics/v3/athletes/${ATHLETE_ID}/consolidatedtimedmetric`],
        ["POST", "/metrics/v3/athletes/1/consolidatedtimedmetric/extra"],
        ["GET", "/users/v3/token-all"],
      ];

      // Act
      const results = probes.map(([method, path]) => isAllowed(method, path));

      // Assert
      expect(results).toEqual([false, false, false, false, false]);
    });
  });

  describe("tpFetch", () => {
    it("should block a disallowed path before hitting the network", async () => {
      // Arrange
      const path = "/users/v3/user";

      // Act
      const res = await tpFetch(path, "GET");

      // Assert
      expect(res).toEqual({
        ok: false,
        error: "Blocked: disallowed path or method",
      });
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("read-metrics token-exchange → Bearer flow", () => {
    it("should exchange the cookie for a token then call the metrics API with the Bearer", async () => {
      // Arrange
      fetch
        .mockResolvedValueOnce(tokenResponse(tokenPayload("tok")))
        .mockResolvedValueOnce(jsonResp(METRICS_BODY));

      // Act
      const result = await readMetrics(
        { start: START_DATE, end: END_DATE },
        { minIntervalMs: 0 }
      );

      // Assert
      expect(result).toEqual(METRICS_BODY);
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
      const result = await readMetrics(
        { start: START_DATE, end: END_DATE },
        { minIntervalMs: 0 }
      );

      // Assert
      expect(result).toEqual(METRICS_BODY);
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
      const result = await readMetrics(
        { start: START_DATE, end: END_DATE },
        { minIntervalMs: 0 }
      );

      // Assert
      expect(result).toEqual(METRICS_BODY);
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
      const attempt = readMetrics(
        { start: START_DATE, end: END_DATE },
        { minIntervalMs: 0 }
      );

      // Assert
      await expect(attempt).rejects.toMatchObject({ needsReauth: true });
    });

    it("should reject when the date range is missing", async () => {
      // Arrange
      const message = { start: START_DATE };

      // Act
      const attempt = readMetrics(message, { minIntervalMs: 0 });

      // Assert
      await expect(attempt).rejects.toThrow("Missing start/end date range");
    });
  });

  describe("push-weight", () => {
    it("should POST the weight metric to the write endpoint with a Bearer header", async () => {
      // Arrange
      await seedToken("bear");
      const metric = {
        athleteId: ATHLETE_ID,
        timeStamp: "2026-07-01T07:30:00.000Z",
        id: null,
        details: [{ type: WEIGHT_TYPE, value: WEIGHT_KG, units: "kg" }],
      };
      fetch.mockResolvedValueOnce(jsonResp({ id: 555 }));

      // Act
      const result = await pushWeight({ metric });

      // Assert
      expect(result).toEqual({ id: 555 });
      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(METRIC_WRITE_URL);
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("omit");
      expect(init.headers.Authorization).toBe("Bearer bear");
      expect(init.body).toBe(JSON.stringify(metric));
    });

    it("should reject a push without a metric payload", async () => {
      // Arrange
      const message = { action: "push-weight" };

      // Act
      const attempt = pushWeight(message);

      // Assert
      await expect(attempt).rejects.toThrow("Missing metric payload");
    });
  });

  describe("checkSession", () => {
    it("should report authenticated and the athlete id on a live session", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(tokenResponse(tokenPayload("tok")));

      // Act
      const result = await checkSession();

      // Assert
      expect(result.authenticated).toBe(true);
      expect(result.athleteId).toBe(ATHLETE_ID);
      expect(result).toMatchObject({
        id: "trainingpeaks-bridge",
        name: "TrainingPeaks",
        version: pkg.version,
        protocolVersion: EXPECTED_PROTOCOL_VERSION,
        capabilities: ["read:body", "write:body"],
      });
    });

    it("should report not-authenticated when the session is dead", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(opaqueRedirectResponse());

      // Act
      const result = await checkSession();

      // Assert
      expect(result.authenticated).toBe(false);
    });

    it("should never expose the access token in the probe response", async () => {
      // Arrange
      fetch.mockResolvedValueOnce(tokenResponse(tokenPayload(SECRET_TOKEN)));

      // Act
      const result = await checkSession();

      // Assert
      expect(JSON.stringify(result)).not.toContain(SECRET_TOKEN);
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
      await readMetrics(
        { start: START_DATE, end: END_DATE },
        { minIntervalMs: 0 }
      );

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

  describe("onMessage listener", () => {
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
