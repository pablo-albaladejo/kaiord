import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  ALLOWED,
  isAllowed,
  handleWhoopFetch,
  onWindowMessage,
  scanCognitoStorage,
} = require("../content.js");

// Captured at import time (before any reset clears the mock call history),
// mirroring the background.js test pattern for the registered listener.
const messageCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const WHOOP_ORIGIN = "https://app.whoop.com";

// Paths exactly as the App's WHOOP Connector builds them.
const CYCLES =
  "/core-details-bff/v0/cycles/details?id=1&startTime=2026-01-01T00%3A00%3A00.000Z&endTime=2026-01-02T00%3A00%3A00.000Z";
const BIOMARKERS = "/advanced-labs-service/v1/biomarker-tests";

describe("content.js second closed list, equal to the service worker's", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should hold the same entries as the service worker's ALLOWED", () => {
    // Arrange
    const background = require("../background.js");
    const entries = (list) =>
      list.map((r) => [r.method, r.pattern.source, r.pattern.flags]);

    // Act
    const content = entries(ALLOWED);

    // Assert
    expect(content).toEqual(entries(background.ALLOWED));
  });

  it.each([
    CYCLES,
    "/metrics-service/v1/metrics/user/123?name=heart_rate&start=2026-01-01T00%3A00%3A00.000Z&end=2026-01-02T00%3A00%3A00.000Z&step=60",
    "/activities-service/v1/sports/history?countryCode=ES",
    BIOMARKERS,
    "/advanced-labs-service/v1/biomarker-tests/abc-1/summary",
    "/health-service/v2/stress-bff/2026-07-10",
  ])("should allow the listed read %s", (path) => {
    // Arrange

    // Act
    const allowed = isAllowed("GET", path);

    // Assert
    expect(allowed).toBe(true);
  });

  it.each([
    "/users-service/v2/bff/users/me",
    "/core-details-bff/v0/cycles/details?apiVersion=7&id=1",
    "/activities-service/v1/sports/history?apiVersion=7",
    "/advanced-labs-service/v1/biomarker-tests/../../users",
    "https://evil.example/x",
    "//evil.example/x",
    "x/y",
  ])("should refuse %s, which is not on the closed list", (path) => {
    // Arrange

    // Act
    const allowed = isAllowed("GET", path);

    // Assert
    expect(allowed).toBe(false);
  });

  it("should reject any non-GET method on an allowlisted path", () => {
    // Arrange

    // Act
    const allowed = isAllowed("POST", BIOMARKERS);

    // Assert
    expect(allowed).toBe(false);
  });

  it("should reject a path that is not a string", () => {
    // Arrange
    const unparseable = Symbol("bad-path");

    // Act
    const allowed = isAllowed("GET", unparseable);

    // Assert
    expect(allowed).toBe(false);
  });

  it("should answer an unlisted WHOOP API read refused, with no request sent", async () => {
    // Arrange
    const msg = {
      action: "whoop-fetch",
      path: "/users-service/v2/bff/users/me",
      token: "t",
    };

    // Act
    const result = await handleWhoopFetch(msg);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Blocked: disallowed path or method",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("content.js handleWhoopFetch", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should block a path on another host without making a network call", async () => {
    // Arrange
    const msg = {
      action: "whoop-fetch",
      path: "//evil.example/steal",
      token: "t",
    };

    // Act
    const result = await handleWhoopFetch(msg);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Blocked: disallowed path or method",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should block a non-GET method without making a network call", async () => {
    // Arrange
    const msg = {
      action: "whoop-fetch",
      path: BIOMARKERS,
      method: "POST",
      token: "t",
    };

    // Act
    const result = await handleWhoopFetch(msg);

    // Assert
    expect(result).toEqual({
      ok: false,
      error: "Blocked: disallowed path or method",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should fetch an allowed cycles path from the tab origin with the bearer token", async () => {
    // Arrange
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: () => Promise.resolve(JSON.stringify({ records: [] })),
    });

    // Act
    const result = await handleWhoopFetch({
      action: "whoop-fetch",
      path: CYCLES,
      token: "tok-123",
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      status: 200,
      contentType: "application/json",
      body: '{"records":[]}',
    });
    expect(fetch).toHaveBeenCalledWith(
      `https://api.prod.whoop.com${CYCLES}`,
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          authorization: "bearer tok-123",
          accept: "application/json",
        }),
      })
    );
  });

  it("should surface the status on a non-2xx response without throwing", async () => {
    // Arrange
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(""),
    });

    // Act
    const result = await handleWhoopFetch({
      action: "whoop-fetch",
      path: BIOMARKERS,
      token: "t",
    });

    // Assert
    expect(result).toEqual({
      ok: false,
      status: 401,
      contentType: "",
      body: "",
    });
  });

  it("should hand a body that is not JSON back unread", async () => {
    // Arrange
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("not-json-body"),
    });

    // Act
    const result = await handleWhoopFetch({
      action: "whoop-fetch",
      path: BIOMARKERS,
      token: "t",
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      status: 200,
      contentType: "",
      body: "not-json-body",
    });
  });

  it("should report a timeout when the request is aborted after 30s", async () => {
    // Arrange
    vi.useFakeTimers();
    fetch.mockImplementation(
      (_url, opts) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener("abort", () => {
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );

    // Act
    const pending = handleWhoopFetch({
      action: "whoop-fetch",
      path: BIOMARKERS,
      token: "t",
    });
    await vi.advanceTimersByTimeAsync(30000);
    const result = await pending;

    // Assert
    expect(result).toEqual({ ok: false, error: "Timed out" });
    vi.useRealTimers();
  });

  it("should surface a non-abort network failure by its message", async () => {
    // Arrange
    fetch.mockRejectedValue(new Error("Network down"));

    // Act
    const result = await handleWhoopFetch({
      action: "whoop-fetch",
      path: BIOMARKERS,
      token: "t",
    });

    // Assert
    expect(result).toEqual({ ok: false, error: "Network down" });
  });
});

describe("content.js token relay", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should relay a token from the WHOOP origin to the background", () => {
    // Arrange
    const event = {
      source: window,
      origin: WHOOP_ORIGIN,
      data: { __whoopPoc: "token", token: "captured" },
    };

    // Act
    onWindowMessage(event);

    // Assert
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: "capture-token",
      token: "captured",
    });
  });

  it("should reject a token message from a foreign origin", () => {
    // Arrange
    const event = {
      source: window,
      origin: "https://evil.example",
      data: { __whoopPoc: "token", token: "x" },
    };

    // Act
    onWindowMessage(event);

    // Assert
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("should reject a token message whose source is not this window", () => {
    // Arrange
    const event = {
      source: { other: true },
      origin: WHOOP_ORIGIN,
      data: { __whoopPoc: "token", token: "x" },
    };

    // Act
    onWindowMessage(event);

    // Assert
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("should ignore a same-window WHOOP-origin message with no data payload", () => {
    // Arrange
    const event = { source: window, origin: WHOOP_ORIGIN, data: undefined };

    // Act
    onWindowMessage(event);

    // Assert
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("should ignore a same-window WHOOP-origin message with the wrong marker", () => {
    // Arrange
    const event = {
      source: window,
      origin: WHOOP_ORIGIN,
      data: { __whoopPoc: "not-token", token: "x" },
    };

    // Act
    onWindowMessage(event);

    // Assert
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("should ignore a same-window WHOOP-origin token message with no token value", () => {
    // Arrange
    const event = {
      source: window,
      origin: WHOOP_ORIGIN,
      data: { __whoopPoc: "token" },
    };

    // Act
    onWindowMessage(event);

    // Assert
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });
});

describe("content.js scanCognitoStorage", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("should relay the Cognito access token found in localStorage", () => {
    // Arrange
    const keys = [
      "unrelated-key",
      "CognitoIdentityServiceProvider.abc.accessToken",
    ];
    globalThis.localStorage = {
      length: keys.length,
      key: (i) => keys[i],
      getItem: (key) =>
        key === "CognitoIdentityServiceProvider.abc.accessToken"
          ? "cognito-token"
          : null,
    };

    // Act
    const token = scanCognitoStorage();

    // Assert
    expect(token).toBe("cognito-token");
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: "capture-token",
      token: "cognito-token",
    });
  });

  it("should skip a matching key whose stored value is empty", () => {
    // Arrange
    globalThis.localStorage = {
      length: 1,
      key: () => "CognitoIdentityServiceProvider.abc.accessToken",
      getItem: () => "",
    };

    // Act
    const token = scanCognitoStorage();

    // Assert
    expect(token).toBeNull();
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("should return null when no key matches the Cognito pattern", () => {
    // Arrange
    globalThis.localStorage = {
      length: 2,
      key: (i) => [null, "some-other-key"][i],
      getItem: () => null,
    };

    // Act
    const token = scanCognitoStorage();

    // Assert
    expect(token).toBeNull();
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("should swallow a throwing localStorage access and return null", () => {
    // Arrange
    globalThis.localStorage = {
      get length() {
        throw new Error("SecurityError");
      },
    };

    // Act
    const token = scanCognitoStorage();

    // Assert
    expect(token).toBeNull();
  });
});

describe("content.js registered onMessage listener", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should keep the channel open and relay a whoop-fetch action to handleWhoopFetch", async () => {
    // Arrange
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: () => Promise.resolve(JSON.stringify({ records: [] })),
    });
    const sendResponse = vi.fn();

    // Act
    const kept = messageCb(
      {
        action: "whoop-fetch",
        path: BIOMARKERS,
        token: "t",
      },
      {},
      sendResponse
    );
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalled());

    // Assert
    expect(kept).toBe(true);
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, status: 200 })
    );
  });

  it("should ignore a message whose action is not whoop-fetch", () => {
    // Arrange
    const sendResponse = vi.fn();

    // Act
    const kept = messageCb({ action: "something-else" }, {}, sendResponse);

    // Assert
    expect(kept).toBeUndefined();
    expect(sendResponse).not.toHaveBeenCalled();
  });
});
