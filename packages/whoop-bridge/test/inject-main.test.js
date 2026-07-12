import { beforeEach, describe, expect, it, vi } from "vitest";

// installFetchWrap/installXhrWrap only wrap window.fetch /
// XMLHttpRequest.prototype.setRequestHeader when those globals are already
// present at module-load time (both early-return otherwise). The chrome-mock
// window stub has no fetch, and plain Node has no global XMLHttpRequest, so
// both stubs are installed here — before the one-and-only require below —
// mirroring how the real page (which always has both) gets wrapped.
const originalFetch = vi.fn().mockResolvedValue("stub-response");
window.fetch = originalFetch;

const originalSetRequestHeader = vi.fn();
class StubXHR {}
StubXHR.prototype.setRequestHeader = originalSetRequestHeader;
globalThis.XMLHttpRequest = StubXHR;

const {
  report,
  extractBearer,
  readAuthHeader,
  resetDedup,
  TARGET_ORIGIN,
} = require("../inject-main.js");

describe("inject-main.js token capture", () => {
  beforeEach(() => {
    __resetChromeMock();
    resetDedup();
  });

  it("should post the extracted bearer to the WHOOP page origin, not a wildcard", () => {
    // Arrange
    const header = "bearer abc.def.ghi";

    // Act
    report(header);

    // Assert
    expect(TARGET_ORIGIN).toBe("https://app.whoop.com");
    expect(window.postMessage).toHaveBeenCalledWith(
      { __whoopPoc: "token", token: "abc.def.ghi" },
      "https://app.whoop.com"
    );
  });

  it("should dedupe repeated tokens and only post distinct ones", () => {
    // Arrange

    // Act
    report("bearer same");
    report("bearer same");
    report("Bearer another");

    // Assert
    expect(window.postMessage).toHaveBeenCalledTimes(2);
  });

  it("should ignore non-bearer, empty, and null authorization values", () => {
    // Arrange

    // Act
    report("Basic Zm9vOmJhcg==");
    report("");
    report(null);

    // Assert
    expect(window.postMessage).not.toHaveBeenCalled();
  });

  it("should strip the bearer prefix case-insensitively", () => {
    // Arrange

    // Act
    const token = extractBearer("Bearer XYZ.123");

    // Assert
    expect(token).toBe("XYZ.123");
  });
});

describe("inject-main.js readAuthHeader", () => {
  it("should read the authorization value out of a Headers-compatible object", () => {
    // Arrange
    const headers = { Authorization: "Bearer xyz.123" };

    // Act
    const value = readAuthHeader(headers);

    // Assert
    expect(value).toBe("Bearer xyz.123");
  });

  it("should return null when the Headers constructor rejects the input", () => {
    // Arrange
    const malformed = 42;

    // Act
    const value = readAuthHeader(malformed);

    // Assert
    expect(value).toBeNull();
  });
});

describe("inject-main.js installFetchWrap", () => {
  beforeEach(() => {
    __resetChromeMock();
    resetDedup();
  });

  it("should capture the bearer from init.headers and still call the original fetch", async () => {
    // Arrange

    // Act
    const response = await window.fetch("https://api.prod.whoop.com/x", {
      headers: { Authorization: "Bearer init.token" },
    });

    // Assert
    expect(response).toBe("stub-response");
    expect(window.postMessage).toHaveBeenCalledWith(
      { __whoopPoc: "token", token: "init.token" },
      "https://app.whoop.com"
    );
    expect(originalFetch).toHaveBeenCalledWith(
      "https://api.prod.whoop.com/x",
      expect.objectContaining({ headers: { Authorization: "Bearer init.token" } })
    );
  });

  it("should capture the bearer from a Request instance when init has no headers", async () => {
    // Arrange
    const request = new Request("https://api.prod.whoop.com/x", {
      headers: { Authorization: "Bearer request.token" },
    });

    // Act
    await window.fetch(request);

    // Assert
    expect(window.postMessage).toHaveBeenCalledWith(
      { __whoopPoc: "token", token: "request.token" },
      "https://app.whoop.com"
    );
    expect(originalFetch).toHaveBeenCalledWith(request);
  });

  it("should not report when neither init.headers nor a Request carries a header", async () => {
    // Arrange

    // Act
    await window.fetch("https://api.prod.whoop.com/x");

    // Assert
    expect(window.postMessage).not.toHaveBeenCalled();
    expect(originalFetch).toHaveBeenCalledWith("https://api.prod.whoop.com/x");
  });

  it("should never break the page when reporting the captured token throws", async () => {
    // Arrange
    window.postMessage.mockImplementationOnce(() => {
      throw new Error("postMessage boom");
    });

    // Act
    const response = await window.fetch("https://api.prod.whoop.com/x", {
      headers: { Authorization: "Bearer swallow.token" },
    });

    // Assert
    expect(response).toBe("stub-response");
    expect(originalFetch).toHaveBeenCalled();
  });
});

describe("inject-main.js installXhrWrap", () => {
  beforeEach(() => {
    __resetChromeMock();
    resetDedup();
  });

  it("should capture the bearer set via setRequestHeader, case-insensitively, and still call through", () => {
    // Arrange
    const xhr = new StubXHR();

    // Act
    xhr.setRequestHeader("AUTHORIZATION", "Bearer xhr.token");

    // Assert
    expect(window.postMessage).toHaveBeenCalledWith(
      { __whoopPoc: "token", token: "xhr.token" },
      "https://app.whoop.com"
    );
    expect(originalSetRequestHeader).toHaveBeenCalledWith(
      "AUTHORIZATION",
      "Bearer xhr.token"
    );
  });

  it("should ignore non-authorization headers", () => {
    // Arrange
    const xhr = new StubXHR();

    // Act
    xhr.setRequestHeader("Content-Type", "application/json");

    // Assert
    expect(window.postMessage).not.toHaveBeenCalled();
    expect(originalSetRequestHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json"
    );
  });

  it("should never break the page when reporting the captured header throws", () => {
    // Arrange
    window.postMessage.mockImplementationOnce(() => {
      throw new Error("postMessage boom");
    });
    const xhr = new StubXHR();

    // Act
    xhr.setRequestHeader("authorization", "Bearer swallow.xhr");

    // Assert
    expect(originalSetRequestHeader).toHaveBeenCalledWith(
      "authorization",
      "Bearer swallow.xhr"
    );
  });
});
