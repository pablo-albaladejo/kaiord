import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  isAllowedPath,
  dispatchExternal,
  isAllowedSenderOrigin,
  EXTERNAL_ACTIONS,
  PROTOCOL_VERSION,
  handleAction,
} = require("../background.js");

describe("isAllowedPath", () => {
  it.each([
    { path: "/v2/recovery" },
    { path: "/v2/activity/sleep" },
    { path: "/v2/cycle/123/recovery" },
    { path: "/v2/user/profile" },
  ])("should allow the allowlisted path $path", ({ path }) => {
    // Arrange

    // Act
    const allowed = isAllowedPath(path);

    // Assert
    expect(allowed).toBe(true);
  });

  it.each([
    {
      label: "dot-segment traversal",
      path: "/v2/recovery/../../oauth/oauth2/token",
    },
    { label: "prefix-string trick", path: "/v2/recoveryX" },
    { label: "unlisted endpoint", path: "/v2/workout" },
    { label: "empty path", path: "" },
  ])("should reject $label", ({ path }) => {
    // Arrange

    // Act
    const allowed = isAllowedPath(path);

    // Assert
    expect(allowed).toBe(false);
  });
});

describe("isAllowedSenderOrigin", () => {
  it.each([
    { origin: "https://app.kaiord.com" },
    { origin: "http://localhost:5173" },
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
      label: "kaiord lookalike",
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

describe("dispatchExternal", () => {
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

  it("should keep credential writes popup-only even from a pinned origin", () => {
    // Arrange
    const respond = vi.fn();
    const sender = { origin: "https://app.kaiord.com" };

    // Act
    dispatchExternal(
      { action: "set-credentials", clientId: "x", clientSecret: "y" },
      sender,
      respond
    );

    // Assert
    expect(EXTERNAL_ACTIONS.has("set-credentials")).toBe(false);
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: "Origin or action not permitted",
      })
    );
  });

  it("should dispatch an allowed external action from a pinned origin", async () => {
    // Arrange
    const respond = vi.fn();
    const sender = { origin: "http://localhost:5173" };

    // Act
    dispatchExternal({ action: "status" }, sender, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalled());

    // Assert
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, protocolVersion: PROTOCOL_VERSION })
    );
  });
});

describe("handleAction", () => {
  beforeEach(() => {
    globalThis.__resetChromeMock();
  });

  it("should reject an unknown action", async () => {
    // Arrange

    // Act
    const attempt = handleAction({ action: "no-such-action" });

    // Assert
    await expect(attempt).rejects.toThrow("Unknown action: no-such-action");
  });

  it("should reject set-credentials without both fields", async () => {
    // Arrange

    // Act
    const attempt = handleAction({ action: "set-credentials", clientId: "x" });

    // Assert
    await expect(attempt).rejects.toThrow("Missing clientId or clientSecret");
  });

  it("should persist credentials when both fields are present", async () => {
    // Arrange
    const message = {
      action: "set-credentials",
      clientId: "id-1",
      clientSecret: "secret-1",
    };

    // Act
    const result = await handleAction(message);

    // Assert
    expect(result).toEqual({ hasCredentials: true });
    expect(globalThis.__chromeLocalStore.whoopCredentials).toEqual({
      clientId: "id-1",
      clientSecret: "secret-1",
    });
  });

  it("should reject whoop-fetch without a path", async () => {
    // Arrange

    // Act
    const attempt = handleAction({ action: "whoop-fetch" });

    // Assert
    await expect(attempt).rejects.toThrow("Missing path");
  });

  it("should report no credentials in the status action by default", async () => {
    // Arrange

    // Act
    const status = await handleAction({ action: "status" });

    // Assert
    expect(status).toMatchObject({ hasCredentials: false });
  });

  it("should merge the bridge manifest into the ping response", async () => {
    // Arrange

    // Act
    const result = await handleAction({ action: "ping" });

    // Assert
    expect(result).toMatchObject({
      id: "whoop-bridge",
      name: "WHOOP",
      protocolVersion: 1,
      capabilities: ["read:body", "read:sleep"],
      hasCredentials: false,
    });
  });
});

describe("isAllowedPath input hardening", () => {
  it("should reject a non-string path via the URL-parse guard", () => {
    // Arrange

    // Act
    const allowed = isAllowedPath(123);

    // Assert
    expect(allowed).toBe(false);
  });
});
