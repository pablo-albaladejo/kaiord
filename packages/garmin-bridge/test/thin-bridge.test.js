import { afterEach, beforeEach, describe, expect, it } from "vitest";

// The thin Bridge at the message contract (ADR 0004): the extension lends
// the athlete's Garmin Session and executes requests from a closed list of
// method + path patterns, a body only where an entry declares one and only
// in its declared shape, answering with Garmin's raw answer. What to ask for
// and how to read it is the Kaiord App's Garmin Connector.

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
const CONNECTAPI = "https://connectapi.garmin.com";
const LIST = "/workout-service/workouts?start=0&limit=20";

const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const seedTokens = () =>
  chrome.storage.local.set({
    garminOAuth1: { oauth_token: "t", oauth_token_secret: "s" },
    garminOAuth2: {
      access_token: "bear",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });

const reply = (body, status = 200, contentType = "application/json") => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => contentType },
  json: () => Promise.reject(new Error("the bridge never parses")),
  text: () => Promise.resolve(body),
});

const answer = (cb, message, sender) =>
  new Promise((resolve) => {
    const open = cb(message, sender, resolve);
    if (open === false) resolve("no answer");
  });

const fitBytes = () => {
  const bytes = new Array(16).fill(0);
  bytes[0] = 14;
  [".", "F", "I", "T"].forEach((c, i) => (bytes[8 + i] = c.charCodeAt(0)));
  return bytes;
};

const WORKOUT = {
  workoutName: "Tempo",
  sportType: { sportTypeId: 1, sportTypeKey: "running", displayOrder: 1 },
  workoutSegments: [
    {
      segmentOrder: 1,
      sportType: { sportTypeId: 1, sportTypeKey: "running", displayOrder: 1 },
      workoutSteps: [{ type: "ExecutableStepDTO", stepOrder: 1 }],
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

  it("should return Garmin's raw answer for a request on a listed path", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply('[{"workoutId":1}]'));
    const message = { action: "request", method: "GET", path: LIST };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res).toEqual({
      ok: true,
      protocolVersion: 2,
      data: {
        status: 200,
        contentType: "application/json",
        body: '[{"workoutId":1}]',
      },
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${CONNECTAPI}${LIST}`);
    expect(init.headers.Authorization).toBe("Bearer bear");
    expect(init.credentials).toBe("omit");
  });

  it.each([
    [
      "an unlisted path",
      { method: "GET", path: "/userprofile-service/socialProfile" },
    ],
    [
      "a listed path with another method",
      { method: "DELETE", path: "/workout-service/workout" },
    ],
    [
      "a query the Connector never builds",
      { method: "GET", path: "/workout-service/workouts?start=0&limit=20&x=1" },
    ],
    [
      "an id with a leading zero",
      { method: "DELETE", path: "/workout-service/schedule/0123" },
    ],
    [
      "the upload under another name",
      {
        method: "POST",
        path: "/upload-service/upload/x.fit",
        body: fitBytes(),
      },
    ],
    ["a header", { method: "GET", path: LIST, headers: { Cookie: "x" } }],
    ["a body on a read", { method: "GET", path: LIST, body: {} }],
    [
      "a body on the calendar delete",
      { method: "DELETE", path: "/workout-service/schedule/12", body: {} },
    ],
    [
      "a write without its body",
      { method: "POST", path: "/workout-service/workout" },
    ],
    [
      "a workout with an undeclared key",
      {
        method: "POST",
        path: "/workout-service/workout",
        body: { ...WORKOUT, ownerId: 1 },
      },
    ],
    [
      "a workout without segments",
      {
        method: "POST",
        path: "/workout-service/workout",
        body: { ...WORKOUT, workoutSegments: [] },
      },
    ],
    [
      "a schedule date that does not exist",
      {
        method: "POST",
        path: "/workout-service/schedule/12",
        body: { date: "2026-02-30" },
      },
    ],
    [
      "a schedule body with another key",
      {
        method: "POST",
        path: "/workout-service/schedule/12",
        body: { date: "2026-09-29", note: "x" },
      },
    ],
    [
      "bytes that are not a FIT file",
      {
        method: "POST",
        path: "/upload-service/upload/.fit",
        body: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      },
    ],
    [
      "a FIT file sent as text",
      { method: "POST", path: "/upload-service/upload/.fit", body: "Li5GSVQ=" },
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

  it("should refuse a path outside its closed list without minting or sending anything", async () => {
    // Arrange
    const message = {
      action: "request",
      method: "GET",
      path: "/userprofile-service/socialProfile",
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.error).toBe("Request not allowed");
    expect(fetch).not.toHaveBeenCalled();
    expect(await chrome.storage.local.get("garminOAuth2")).toEqual({});
  });

  it("should send a workout that matches its declared shape as JSON", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply('{"workoutId":42}'));
    const message = {
      action: "request",
      method: "POST",
      path: "/workout-service/workout",
      body: WORKOUT,
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.data.body).toBe('{"workoutId":42}');
    expect(fetch.mock.calls[0][1].body).toBe(JSON.stringify(WORKOUT));
  });

  it("should send a FIT file as the multipart file field", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply('{"detailedImportResult":{}}', 202));
    const message = {
      action: "request",
      method: "POST",
      path: "/upload-service/upload/.fit",
      body: fitBytes(),
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.ok).toBe(true);
    const init = fetch.mock.calls[0][1];
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get("file").name).toBe("body-composition.fit");
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("should place a workout on a date with the date as the only body", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply('{"workoutScheduleId":9}'));
    const message = {
      action: "request",
      method: "POST",
      path: "/workout-service/schedule/1707805999",
      body: { date: "2026-09-29" },
    };

    // Act
    const res = await answer(externalCb, message, APP);

    // Assert
    expect(res.data.body).toBe('{"workoutScheduleId":9}');
    expect(fetch.mock.calls[0][1].body).toBe('{"date":"2026-09-29"}');
  });

  it("should surface a Session Garmin refuses twice as needsReauth, with nothing read", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValue(reply("<html>sign in</html>", 401, "text/html"));
    vi.spyOn(globalThis.crypto.subtle, "importKey").mockResolvedValue({});
    vi.spyOn(globalThis.crypto.subtle, "sign").mockResolvedValue(
      new Uint8Array(20).buffer
    );

    // Act
    const res = await answer(
      externalCb,
      { action: "request", method: "GET", path: LIST },
      APP
    );

    // Assert
    expect(res.ok).toBe(false);
    expect(res.needsReauth).toBe(true);
    expect(res.data).toBeUndefined();
  });

  it("should pass a Platform failure status on with no body", async () => {
    // Arrange
    seedTokens();
    fetch.mockResolvedValueOnce(reply("Not Found", 404, "text/plain"));

    // Act
    const res = await answer(
      externalCb,
      {
        action: "request",
        method: "DELETE",
        path: "/workout-service/schedule/12",
      },
      APP
    );

    // Assert
    expect(res).toEqual({
      ok: false,
      protocolVersion: 2,
      error: "Request failed: 404",
      status: 404,
    });
  });

  it("should give the App no legacy action that read or wrote by itself", async () => {
    // Arrange
    const legacy = [
      "list",
      "push",
      "activities",
      "push-body-composition",
      "schedule",
      "unschedule",
      "calendar-find",
    ];

    // Act
    const answers = await Promise.all(
      legacy.map((action) => answer(externalCb, { action }, APP))
    );

    // Assert
    answers.forEach((res) =>
      expect(res).toEqual({
        ok: false,
        protocolVersion: 2,
        error: "Origin or action not permitted",
        retryable: false,
      })
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
    const message = { action: "ping" };

    // Act
    const res = await answer(internalCb, message, CONTENT_SCRIPT);

    // Assert
    expect(res).toBe("no answer");
  });

  it("should give a message from another extension no answer", async () => {
    // Arrange
    const other = { ...POPUP, id: "another-extension" };

    // Act
    const res = await answer(internalCb, { action: "ping" }, other);

    // Assert
    expect(res).toBe("no answer");
  });

  it("should refuse the generic request to the popup, as it is reachable only through the App origin gate", async () => {
    // Arrange
    const message = { action: "request", method: "GET", path: LIST };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res).toEqual({
      ok: false,
      protocolVersion: 2,
      error: "Action not permitted",
      retryable: false,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should answer the popup's Session check", async () => {
    // Arrange
    const message = { action: "ping" };

    // Act
    const res = await answer(internalCb, message, POPUP);

    // Assert
    expect(res.ok).toBe(true);
    expect(res.data.session).toBe("not-checked");
  });
});
