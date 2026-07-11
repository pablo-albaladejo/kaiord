import { beforeEach, describe, expect, it } from "vitest";

const {
  isAllowed,
  handleWhoopFetch,
  onWindowMessage,
} = require("../content.js");

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
    "/health-service/v2/stress-bff?id=1",
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
});
