import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The thin Bridge at the message contract (ADR 0004): the extension lends
// the athlete's TrainingPeaks Session, mints its short-lived token only when
// a real request is about to be sent, and executes requests from a closed
// list of method + path patterns, a body only where an entry declares one
// and only in its declared shape. What to ask for, how to read it, pacing
// and the mapping to KRD are the Kaiord App's TrainingPeaks Connector.

const { PROTOCOL_VERSION, ALLOWED } = require("../background.js");

const APP = { origin: "https://kaiord.com" };
const POPUP = {
  id: "test-extension-id",
  origin: "chrome-extension://test-extension-id",
  url: "chrome-extension://test-extension-id/popup.html",
};
const CONTENT_SCRIPT = {
  id: "test-extension-id",
  origin: "https://kaiord.com",
  url: "https://kaiord.com/app/",
  tab: { id: 7 },
};
const TPAPI = "https://tpapi.trainingpeaks.com";
const METRICS =
  "/metrics/v3/athletes/123/consolidatedtimedmetrics/2026-11-01/2026-11-23";

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const seedToken = () =>
  chrome.storage.local.set({
    tpAccessToken: {
      accessToken: "TP-BEARER",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      athleteId: 123,
    },
  });

const reply = (body, status = 200, contentType = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  type: "basic",
  redirected: false,
  headers: { get: () => contentType },
  json: () => Promise.reject(new Error("the bridge never parses")),
  text: () => Promise.resolve(body),
});

const answer = (cb, message, sender) =>
  new Promise((resolve) => {
    const open = cb(message, sender, resolve);
    if (open === false) resolve("no answer");
  });

const WORKOUT = {
  athleteId: 123,
  workoutId: 0,
  workoutDay: "2026-11-24",
  title: "Tempo",
  description: null,
  workoutTypeValueId: 3,
  totalTimePlanned: 1,
  publicSettingValue: 0,
  structure: '{"structure":[]}',
};

const WEIGHT = {
  athleteId: 123,
  timeStamp: "2026-11-23T07:00:00Z",
  id: null,
  details: [
    {
      type: 9,
      label: "Weight",
      value: 72.4,
      time: "2026-11-23T07:00:00Z",
      units: "kg",
      formatedUnits: "kg",
    },
  ],
};

describe("thin Bridge: closed path list", () => {
  beforeEach(() => __resetChromeMock());
  afterEach(() => vi.restoreAllMocks());

  it("should speak protocol version 2", () => {
    // Arrange
    const expected = 2;

    // Act
    const actual = PROTOCOL_VERSION;

    // Assert
    expect(actual).toBe(expected);
  });

  it("should announce the same protocol version it answers with", () => {
    // Arrange
    require("../bridge-identity.js");

    // Act
    const announced = globalThis.KAIORD_BRIDGE_IDENTITY.protocolVersion;

    // Assert
    expect(announced).toBe(PROTOCOL_VERSION);
  });

  it("should return TrainingPeaks' raw answer for a request on a listed path", async () => {
    // Arrange
    seedToken();
    fetch.mockResolvedValueOnce(reply('[{"timeStamp":"2026-11-20"}]'));
    const message = { action: "request", method: "GET", path: METRICS };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual({
      ok: true,
      protocolVersion: 2,
      data: {
        status: 200,
        contentType: "application/json",
        body: '[{"timeStamp":"2026-11-20"}]',
      },
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${TPAPI}${METRICS}`);
    expect(init.headers.Authorization).toBe("Bearer TP-BEARER");
    expect(init.credentials).toBe("omit");
  });

  it.each([
    ["the token endpoint", { method: "GET", path: "/users/v3/token" }],
    ["an unlisted path", { method: "GET", path: "/users/v3/user" }],
    [
      "a listed path with another method",
      { method: "DELETE", path: "/fitness/v6/athletes/123/workouts/9" },
    ],
    [
      "a metric range that is not two dates",
      {
        method: "GET",
        path: "/metrics/v3/athletes/123/consolidatedtimedmetrics/a/b",
      },
    ],
    [
      "a workouts range longer than one day",
      {
        method: "GET",
        path: "/fitness/v6/athletes/123/workouts/2026-11-24/2026-11-25",
      },
    ],
    [
      "a workouts day that is not a date",
      { method: "GET", path: "/fitness/v6/athletes/123/workouts/today/today" },
    ],
    [
      "a body on the day read",
      {
        method: "GET",
        path: "/fitness/v6/athletes/123/workouts/2026-11-24/2026-11-24",
        body: {},
      },
    ],
    [
      "a delete of the day",
      {
        method: "DELETE",
        path: "/fitness/v6/athletes/123/workouts/2026-11-24/2026-11-24",
      },
    ],
    ["a header", { method: "GET", path: METRICS, headers: { Cookie: "x" } }],
    ["a body on a read", { method: "GET", path: METRICS, body: {} }],
    [
      "a write without its body",
      { method: "POST", path: "/fitness/v6/athletes/123/workouts" },
    ],
    [
      "a workout with an undeclared key",
      {
        method: "POST",
        path: "/fitness/v6/athletes/123/workouts",
        body: { ...WORKOUT, userTags: "x" },
      },
    ],
    [
      "a workout that edits an existing one",
      {
        method: "POST",
        path: "/fitness/v6/athletes/123/workouts",
        body: { ...WORKOUT, workoutId: 9 },
      },
    ],
    [
      "a workout on a day that does not exist",
      {
        method: "POST",
        path: "/fitness/v6/athletes/123/workouts",
        body: { ...WORKOUT, workoutDay: "2026-02-30" },
      },
    ],
  ])(
    "should refuse %s without minting or sending anything",
    async (_label, rest) => {
      // Arrange
      const message = { action: "request", ...rest };

      // Act
      const res = await answer(externalCb, message, APP);

      // Assert
      expect(res).toEqual({
        ok: false,
        protocolVersion: 2,
        error: "Request not allowed",
        retryable: false,
      });
      expect(fetch).not.toHaveBeenCalled();
    }
  );

  it("should read the workouts of one day and hand them over unread", async () => {
    // Arrange
    seedToken();
    const day = "/fitness/v6/athletes/123/workouts/2026-11-24/2026-11-24";
    fetch.mockResolvedValueOnce(reply('[{"title":"Tempo"}]'));

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: day },
      APP
    );

    // Assert
    expect(res.data.body).toBe('[{"title":"Tempo"}]');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${TPAPI}${day}`);
    expect(init.method ?? "GET").toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("should refuse to add a weight measurement, which the Kaiord App never sends", async () => {
    // Arrange
    seedToken();
    const message = {
      action: "request",
      method: "POST",
      path: "/metrics/v3/athletes/123/consolidatedtimedmetric",
      body: WEIGHT,
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual({
      ok: false,
      protocolVersion: 2,
      error: "Request not allowed",
      retryable: false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse a path outside its closed list without minting or sending anything", async () => {
    // Arrange
    const message = {
      action: "request",
      method: "GET",
      path: "/users/v3/user",
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.error).toBe("Request not allowed");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should send a workout that matches its declared shape as JSON", async () => {
    // Arrange
    seedToken();
    fetch.mockResolvedValueOnce(reply('{"workoutId":77}'));
    const path = "/fitness/v6/athletes/123/workouts";

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "POST", path, body: WORKOUT },
      APP
    );

    // Assert
    expect(res.data.body).toBe('{"workoutId":77}');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${TPAPI}${path}`);
    expect(init.headers.Authorization).toBe("Bearer TP-BEARER");
    expect(init.credentials).toBe("omit");
    expect(init.body).toBe(JSON.stringify(WORKOUT));
  });

  it("should mint the token right before the first real request, never at the Session check", async () => {
    // Arrange
    fetch
      .mockResolvedValueOnce(
        reply(
          '{"token":{"access_token":"FRESH","expires_in":3600},"athleteId":123}'
        )
      )
      .mockResolvedValueOnce(reply("[]"));
    await answer(externalCb, { action: "ping" }, APP);
    const callsAfterCheck = fetch.mock.calls.length;

    // Act
    await answer(
      externalCb,
      { action: "request", method: "GET", path: METRICS },
      APP
    );

    // Assert
    expect(callsAfterCheck).toBe(0);
    expect(fetch.mock.calls[0][0]).toBe(`${TPAPI}/users/v3/token`);
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer FRESH");
  });

  it("should pass a planning-horizon refusal on as its status, unread", async () => {
    // Arrange
    seedToken();
    fetch.mockResolvedValueOnce(reply('{"message":"upgrade"}', 402));

    // Act
    const res = await answer(
      externalCb,
      {
        action: "request",
        method: "POST",
        path: "/fitness/v6/athletes/123/workouts",
        body: WORKOUT,
      },
      APP
    );

    // Assert
    expect(res).toEqual({
      ok: false,
      protocolVersion: 2,
      error: "Request failed: 402",
      status: 402,
    });
  });

  it("should surface a Session TrainingPeaks refuses twice as needsReauth, with nothing read", async () => {
    // Arrange
    seedToken();
    fetch.mockResolvedValueOnce(reply("no", 401)).mockResolvedValueOnce({
      ...reply(""),
      ok: false,
      status: 0,
      type: "opaqueredirect",
    });

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: METRICS },
      APP
    );

    // Assert
    expect(res.ok).toBe(false);
    expect(res.needsReauth).toBe(true);
    expect(res.data).toBeUndefined();
  });

  it("should give the App no legacy action that read or wrote by itself", async () => {
    // Arrange
    const legacy = [
      "read-metrics",
      "push-weight",
      "push-workout",
      "read-workout",
    ];

    // Act
    const answers = await Promise.all(
      legacy.map((action) => answer(externalCb, { action }, APP))
    );

    // Assert
    answers.forEach((res) =>
      expect(res.error).toBe("Origin or action not permitted")
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should declare a body schema for exactly the write entries", () => {
    // Arrange
    const writes = ALLOWED.filter((r) => r.method === "POST");

    // Act
    const withBody = ALLOWED.filter((r) => r.body);

    // Assert
    expect(withBody).toEqual(writes);
  });
});

describe("thin Bridge: internal channel is the popup's only", () => {
  beforeEach(() => __resetChromeMock());

  it("should give a content script no answer, whatever the action", async () => {
    // Arrange
    const message = { action: "read-athlete-id" };

    // Act
    const res = await answer(internalCb, message, CONTENT_SCRIPT);

    // Assert
    expect(res).toBe("no answer");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should refuse the generic request to the popup, as it is reachable only through the App origin gate", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: METRICS };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res.error).toBe("Action not permitted");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should answer the popup's Session check", async () => {
    // Arrange
    const message = { action: "checkSession" };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res.ok).toBe(true);
    expect(res.data.session).toBe("not-checked");
  });
});

describe("popup reads (ADR 0004's bounded exception)", () => {
  it("should answer every popup read on the popup's channel and none on the App's", () => {
    // Arrange
    const bg = require("../background.js");

    // Act
    const reads = [...bg.POPUP_READS];

    // Assert
    expect(reads.every((a) => bg.INTERNAL_ACTIONS.has(a))).toBe(true);
    expect(reads.some((a) => bg.EXTERNAL_ACTIONS.has(a))).toBe(false);
    expect(Array.isArray(bg.POPUP_READ_SCRIPTS)).toBe(true);
  });
});
