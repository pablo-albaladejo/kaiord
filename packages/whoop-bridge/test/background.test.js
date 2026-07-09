import { describe, expect, it, vi } from "vitest";

const {
  isAllowedPath,
  dispatchExternal,
  isAllowedSenderOrigin,
  EXTERNAL_ACTIONS,
  PROTOCOL_VERSION,
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
