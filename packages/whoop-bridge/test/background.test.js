import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  decodeUserId,
  storeToken,
  getSessionStatus,
  whoopFetch,
  handleAction,
  dispatchExternal,
  isAllowedSenderOrigin,
  EXTERNAL_ACTIONS,
} = require("../background.js");
const pkg = require("../package.json");

// Listener callbacks registered at import time (before any reset).
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const webRequestCb =
  chrome.webRequest.onBeforeSendHeaders.addListener.mock.calls[0][0];

// A JWT is header.payload.signature, base64url, no signature verification here.
const makeJwt = (payload) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(payload)}.sig`;
};

describe("PROTOCOL_VERSION and BRIDGE_MANIFEST", () => {
  it("should expose protocol version 1", () => {
    // Arrange

    // Act

    // Assert
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it("should carry the WHOOP identity with enum-valid capabilities", () => {
    // Arrange

    // Act

    // Assert
    expect(BRIDGE_MANIFEST).toEqual({
      id: "whoop-bridge",
      name: "WHOOP",
      version: pkg.version,
      protocolVersion: 1,
      capabilities: ["read:body", "read:sleep"],
    });
  });
});

describe("decodeUserId", () => {
  it("should decode the numeric custom:user_id claim from the JWT", () => {
    // Arrange
    const jwt = makeJwt({ "custom:user_id": "1234567", sub: "cognito-uuid" });

    // Act
    const userId = decodeUserId(jwt);

    // Assert
    expect(userId).toBe(1234567);
  });

  it("should return null for a malformed token", () => {
    // Arrange
    const jwt = "not-a-jwt";

    // Act
    const userId = decodeUserId(jwt);

    // Assert
    expect(userId).toBeNull();
  });
});

describe("storeToken and getSessionStatus", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should persist the token to session storage and decode the user id", async () => {
    // Arrange
    const jwt = makeJwt({ "custom:user_id": "42" });

    // Act
    await storeToken(jwt);

    // Assert
    expect(chrome.storage.session.set).toHaveBeenCalledWith(
      expect.objectContaining({ whoopToken: jwt, whoopUserId: 42 })
    );
  });

  it("should report session presence as a boolean and never expose the token", async () => {
    // Arrange
    const jwt = makeJwt({ "custom:user_id": "42" });
    await storeToken(jwt);

    // Act
    const status = await getSessionStatus();

    // Assert
    expect(status.connected).toBe(true);
    expect(status.userId).toBe(42);
    expect(JSON.stringify(status)).not.toContain(jwt);
  });

  it("should report not connected when no token has been captured", async () => {
    // Arrange

    // Act
    const status = await getSessionStatus();

    // Assert
    expect(status.connected).toBe(false);
    expect(status.userId).toBeNull();
  });
});

describe("webRequest secondary capture", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should capture the bearer from an Authorization header", () => {
    // Arrange
    const jwt = makeJwt({ "custom:user_id": "7" });

    // Act
    webRequestCb({
      requestHeaders: [{ name: "Authorization", value: `bearer ${jwt}` }],
    });

    // Assert
    expect(chrome.storage.session.set).toHaveBeenCalledWith(
      expect.objectContaining({ whoopToken: jwt, whoopUserId: 7 })
    );
  });

  it("should ignore requests with no Authorization header", () => {
    // Arrange

    // Act
    webRequestCb({ requestHeaders: [{ name: "accept", value: "*/*" }] });

    // Assert
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
  });
});

describe("whoopFetch tab dependency", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should fail with a descriptive error when no token is captured", async () => {
    // Arrange

    // Act
    const failure = whoopFetch("/core-details-bff/v0/cycles/details");

    // Assert
    await expect(failure).rejects.toThrow(/no session token captured/);
  });

  it("should fail with 'No app.whoop.com tab open.' when a token exists but no tab is open", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": "1" }));
    chrome.tabs.query.mockImplementation((q, cb) => cb([]));

    // Act
    const failure = whoopFetch("/core-details-bff/v0/cycles/details");

    // Assert
    await expect(failure).rejects.toThrow("No app.whoop.com tab open.");
  });

  it("should relay the read to the WHOOP tab's content script when connected", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": "1" }));
    chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 99 }]));
    chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
      cb({ ok: true, status: 200, data: { records: [] } })
    );

    // Act
    const result = await whoopFetch("/core-details-bff/v0/cycles/details");

    // Assert
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      99,
      expect.objectContaining({
        action: "whoop-fetch",
        path: "/core-details-bff/v0/cycles/details",
      }),
      expect.any(Function)
    );
    expect(result).toEqual({ ok: true, status: 200, data: { records: [] } });
  });
});

describe("handleAction ping", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should return the bridge manifest plus a boolean session status", async () => {
    // Arrange

    // Act
    const data = await handleAction({ action: "ping" });

    // Assert
    expect(data).toMatchObject({
      id: "whoop-bridge",
      name: "WHOOP",
      version: pkg.version,
      protocolVersion: 1,
      capabilities: ["read:body", "read:sleep"],
      connected: false,
    });
  });

  it("should let manifest identity keys win over session fields on collision", async () => {
    // Arrange
    // A stray "id" leaking into session storage must not override the manifest.
    await chrome.storage.session.set({ id: "spoofed" });

    // Act
    const data = await handleAction({ action: "ping" });

    // Assert
    expect(data.id).toBe("whoop-bridge");
  });

  it("should store a token relayed via the capture-token action", async () => {
    // Arrange
    const jwt = makeJwt({ "custom:user_id": "9" });

    // Act
    const result = await handleAction({ action: "capture-token", token: jwt });

    // Assert
    expect(result).toEqual({ captured: true });
    expect(chrome.storage.session.set).toHaveBeenCalledWith(
      expect.objectContaining({ whoopToken: jwt })
    );
  });
});

describe("isAllowedSenderOrigin", () => {
  it.each([
    { origin: "https://app.kaiord.com" },
    { origin: "http://localhost:5173" },
    { origin: "http://localhost:5174" },
  ])("should accept the pinned origin $origin", ({ origin }) => {
    // Arrange

    // Act
    const allowed = isAllowedSenderOrigin({ origin });

    // Assert
    expect(allowed).toBe(true);
  });

  it.each([
    {
      label: "arbitrary https origin",
      sender: { origin: "https://evil.example" },
    },
    {
      label: "kaiord look-alike",
      sender: { origin: "https://kaiord.com.evil.example" },
    },
    { label: "missing origin", sender: {} },
    { label: "undefined sender", sender: undefined },
  ])("should reject $label", ({ sender }) => {
    // Arrange

    // Act
    const allowed = isAllowedSenderOrigin(sender);

    // Assert
    expect(allowed).toBe(false);
  });
});

describe("dispatchExternal origin pinning", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should refuse messages from a non-pinned origin", () => {
    // Arrange
    const respond = vi.fn();

    // Act
    dispatchExternal(
      { action: "ping" },
      { origin: "https://evil.example" },
      respond
    );

    // Assert
    expect(respond).toHaveBeenCalledWith({
      ok: false,
      protocolVersion: PROTOCOL_VERSION,
      error: "Origin or action not permitted",
      retryable: false,
    });
  });

  it("should reject an unknown action from a pinned origin", () => {
    // Arrange
    const respond = vi.fn();

    // Act
    dispatchExternal(
      { action: "push" },
      { origin: "https://app.kaiord.com" },
      respond
    );

    // Assert
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, error: "Unknown action: push" })
    );
  });

  it("should keep token capture off the external surface", () => {
    // Arrange
    const respond = vi.fn();

    // Act
    dispatchExternal(
      { action: "capture-token", token: "x" },
      { origin: "https://app.kaiord.com" },
      respond
    );

    // Assert
    expect(EXTERNAL_ACTIONS.has("capture-token")).toBe(false);
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: "Unknown action: capture-token",
      })
    );
  });

  it("should dispatch an allowed status action from a pinned origin", async () => {
    // Arrange
    const respond = vi.fn();

    // Act
    dispatchExternal(
      { action: "status" },
      { origin: "http://localhost:5173" },
      respond
    );
    await vi.waitFor(() => expect(respond).toHaveBeenCalled());

    // Assert
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, protocolVersion: PROTOCOL_VERSION })
    );
  });
});
