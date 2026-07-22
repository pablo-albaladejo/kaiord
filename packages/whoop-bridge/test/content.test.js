import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  isAllowed,
  handleWhoopFetch,
  onWindowMessage,
  scanCognitoStorage,
} = require("../content.js");

// Captured at import time (before any reset clears the mock call history),
// mirroring the background.js test pattern for the registered listener.
const messageCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];

const WHOOP_ORIGIN = "https://app.whoop.com";

describe("content.js allowlist", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should allow a GET under the cycles-details prefix", () => {
    // Arrange
    const path = "/core-details-bff/v0/cycles/details?apiVersion=7&id=1";

    // Act
    const allowed = isAllowed("GET", path);

    // Assert
    expect(allowed).toBe(true);
  });

  it.each([
    "/metrics-service/v1/metrics/user/123?name=heart_rate",
    "/activities-service/v1/sports/history?apiVersion=7",
    "/advanced-labs-service/v1/biomarker-tests",
    // Real stress-bff shape (live-probed): a date path segment, no query.
    "/health-service/v2/stress-bff/2026-07-10",
  ])("should allow the read-only path %s", (path) => {
    // Arrange

    // Act
    const allowed = isAllowed("GET", path);

    // Assert
    expect(allowed).toBe(true);
  });

  it("should reject a disallowed path", () => {
    // Arrange

    // Act
    const allowed = isAllowed("GET", "/membership-service/v1/affiliate");

    // Assert
    expect(allowed).toBe(false);
  });

  it("should reject any non-GET method on an allowlisted path", () => {
    // Arrange

    // Act
    const allowed = isAllowed("POST", "/core-details-bff/v0/cycles/details");

    // Assert
    expect(allowed).toBe(false);
  });

  it("should reject a prefix-string look-alike", () => {
    // Arrange

    // Act
    const allowed = isAllowed("GET", "/core-details-bff/v0/cycles/detailsX");

    // Assert
    expect(allowed).toBe(false);
  });

  it("should reject a path that cannot be parsed as a URL", () => {
    // Arrange
    const unparseable = Symbol("bad-path");

    // Act
    const allowed = isAllowed("GET", unparseable);

    // Assert
    expect(allowed).toBe(false);
  });
});

describe("content.js handleWhoopFetch", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should block a disallowed path without making a network call", async () => {
    // Arrange
    const msg = {
      action: "whoop-fetch",
      path: "/membership-service/v1/affiliate",
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
      path: "/core-details-bff/v0/cycles/details",
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
      text: () => Promise.resolve(JSON.stringify({ records: [] })),
    });

    // Act
    const result = await handleWhoopFetch({
      action: "whoop-fetch",
      path: "/core-details-bff/v0/cycles/details?id=1",
      token: "tok-123",
    });

    // Assert
    expect(result).toEqual({ ok: true, status: 200, data: { records: [] } });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.prod.whoop.com/core-details-bff/v0/cycles/details?id=1",
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
      path: "/core-details-bff/v0/cycles/details",
      token: "t",
    });

    // Assert
    expect(result).toEqual({ ok: false, status: 401, data: null });
  });

  it("should fall back to a truncated raw body when the response is not JSON", async () => {
    // Arrange
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve("not-json-body"),
    });

    // Act
    const result = await handleWhoopFetch({
      action: "whoop-fetch",
      path: "/core-details-bff/v0/cycles/details",
      token: "t",
    });

    // Assert
    expect(result).toEqual({ ok: true, status: 200, data: "not-json-body" });
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
      path: "/core-details-bff/v0/cycles/details",
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
      path: "/core-details-bff/v0/cycles/details",
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
    const keys = ["unrelated-key", "CognitoIdentityServiceProvider.abc.accessToken"];
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
      text: () => Promise.resolve(JSON.stringify({ records: [] })),
    });
    const sendResponse = vi.fn();

    // Act
    const kept = messageCb(
      {
        action: "whoop-fetch",
        path: "/core-details-bff/v0/cycles/details",
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
