import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  PROTOCOL_VERSION,
  BRIDGE_MANIFEST,
  decodeUserId,
  storeToken,
  getSessionStatus,
  whoopFetch,
  handleAction,
  dispatch,
  dispatchExternal,
  isAllowedSenderOrigin,
  EXTERNAL_ACTIONS,
  reinjectContentScripts,
} = require("../background.js");
const pkg = require("../package.json");

// Listener callbacks registered at import time (captured before any reset,
// which clears the mock call history).
const externalCb =
  chrome.runtime.onMessageExternal.addListener.mock.calls[0][0];
const internalCb = chrome.runtime.onMessage.addListener.mock.calls[0][0];
const webRequestCb =
  chrome.webRequest.onBeforeSendHeaders.addListener.mock.calls[0][0];
const onInstalledCb = chrome.runtime.onInstalled.addListener.mock.calls[0][0];

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
      capabilities: ["read:body", "read:sleep", "read:activities"],
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

  it("should return null when the custom:user_id claim is absent", () => {
    // Arrange
    const jwt = makeJwt({ sub: "cognito-uuid-only" });

    // Act
    const userId = decodeUserId(jwt);

    // Assert
    expect(userId).toBeNull();
  });

  it("should return null when the custom:user_id claim is not numeric", () => {
    // Arrange
    const jwt = makeJwt({ "custom:user_id": "not-a-number" });

    // Act
    const userId = decodeUserId(jwt);

    // Assert
    expect(userId).toBeNull();
  });

  it("should return null when the payload segment cannot be parsed as JSON", () => {
    // Arrange
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const malformedPayload = Buffer.from("not-json").toString("base64url");
    const jwt = `${b64({ alg: "none" })}.${malformedPayload}.sig`;

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

  it.each([
    { label: "null", token: null },
    { label: "undefined", token: undefined },
    { label: "a non-string", token: 42 },
  ])("should ignore a $label token without touching storage", async ({ token }) => {
    // Arrange

    // Act
    await storeToken(token);

    // Assert
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
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

  it("should reject when chrome.runtime.lastError is set during the tab relay", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": "1" }));
    chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 5 }]));
    chrome.runtime.lastError = { message: "Receiving end does not exist" };
    chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) => cb(undefined));

    // Act
    const failure = whoopFetch("/core-details-bff/v0/cycles/details");

    // Assert
    await expect(failure).rejects.toThrow("Receiving end does not exist");
  });
});

describe("handleAction", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should return the bridge manifest plus a boolean session status on ping", async () => {
    // Arrange

    // Act
    const data = await handleAction({ action: "ping" });

    // Assert
    expect(data).toMatchObject({
      id: "whoop-bridge",
      name: "WHOOP",
      version: pkg.version,
      protocolVersion: 1,
      capabilities: ["read:body", "read:sleep", "read:activities"],
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

  it("should open the WHOOP dashboard tab and return null on open-whoop", async () => {
    // Arrange

    // Act
    const result = await handleAction({ action: "open-whoop" });

    // Assert
    expect(result).toBeNull();
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://app.whoop.com/",
    });
  });

  it("should reject whoop-fetch without a path", async () => {
    // Arrange

    // Act
    const attempt = handleAction({ action: "whoop-fetch" });

    // Assert
    await expect(attempt).rejects.toThrow("Missing path");
  });

  it("should delegate a whoop-fetch action with a path to whoopFetch", async () => {
    // Arrange
    await storeToken(makeJwt({ "custom:user_id": "1" }));
    chrome.tabs.query.mockImplementation((q, cb) => cb([{ id: 99 }]));
    chrome.tabs.sendMessage.mockImplementation((tabId, msg, cb) =>
      cb({ ok: true, status: 200, data: { records: [] } })
    );

    // Act
    const result = await handleAction({
      action: "whoop-fetch",
      path: "/core-details-bff/v0/cycles/details",
    });

    // Assert
    expect(result).toEqual({ ok: true, status: 200, data: { records: [] } });
  });

  it("should reject an unknown action", async () => {
    // Arrange

    // Act
    const attempt = handleAction({ action: "no-such-action" });

    // Assert
    await expect(attempt).rejects.toThrow("Unknown action: no-such-action");
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
    expect(chrome.tabs.query).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith({
      ok: false,
      protocolVersion: PROTOCOL_VERSION,
      error: "Origin or action not permitted",
      retryable: false,
    });
  });

  it("should reject a non-allowlisted action from a pinned origin", () => {
    // Arrange
    const respond = vi.fn();

    // Act
    dispatchExternal(
      { action: "open-whoop" },
      { origin: "https://app.kaiord.com" },
      respond
    );

    // Assert
    expect(chrome.tabs.create).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith({
      ok: false,
      protocolVersion: PROTOCOL_VERSION,
      error: "Origin or action not permitted",
      retryable: false,
    });
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
        error: "Origin or action not permitted",
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

  it("should route through the registered onMessageExternal listener wrapper", async () => {
    // Arrange
    const respond = vi.fn();

    // Act
    externalCb({ action: "status" }, { origin: "https://app.kaiord.com" }, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalled());

    // Assert
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, protocolVersion: PROTOCOL_VERSION })
    );
  });
});

describe("internal dispatch", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should return true and answer the popup status request", async () => {
    // Arrange
    const respond = vi.fn();

    // Act
    const kept = internalCb({ action: "status" }, {}, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalled());

    // Assert
    expect(kept).toBe(true);
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, protocolVersion: PROTOCOL_VERSION })
    );
  });
});

describe("reinjectContentScripts", () => {
  beforeEach(() => {
    __resetChromeMock();
  });

  it("should re-inject only host-permission-covered scripts, preserving the MAIN world", async () => {
    // Arrange
    chrome.runtime.getManifest.mockReturnValue({
      host_permissions: ["https://app.whoop.com/*"],
      content_scripts: [
        {
          matches: ["https://app.whoop.com/*"],
          js: ["inject-main.js"],
          world: "MAIN",
        },
        { matches: ["https://app.whoop.com/*"], js: ["content.js"] },
        {
          matches: ["https://*.kaiord.com/*"],
          js: ["bridge-identity.js", "kaiord-announce.js"],
        },
      ],
    });
    chrome.tabs.query.mockImplementation((q, cb) =>
      typeof cb === "function" ? cb([{ id: 7 }]) : Promise.resolve([{ id: 7 }])
    );

    // Act
    await reinjectContentScripts();

    // Assert
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({ files: ["inject-main.js"], world: "MAIN" })
    );
    expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
      expect.objectContaining({ files: ["content.js"] })
    );
    // The kaiord.com announce entry is not covered by host_permissions.
    expect(chrome.scripting.executeScript).not.toHaveBeenCalledWith(
      expect.objectContaining({ files: ["bridge-identity.js", "kaiord-announce.js"] })
    );
  });

  it("should invoke reinjectContentScripts through the registered onInstalled wrapper", async () => {
    // Arrange

    // Act
    onInstalledCb();
    await vi.waitFor(() => expect(chrome.runtime.getManifest).toHaveBeenCalled());

    // Assert
    expect(chrome.runtime.getManifest).toHaveBeenCalled();
  });
});
