import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DRIVE_APPDATA_SCOPE,
  GIS_SCRIPT_SRC,
  resolveGoogleOAuthClientId,
} from "./google-oauth-config";

describe("resolveGoogleOAuthClientId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return the client id from the environment", () => {
    // Arrange
    vi.stubEnv("VITE_GOOGLE_OAUTH_CLIENT_ID", "client-123.apps.example.com");

    // Act
    const result = resolveGoogleOAuthClientId();

    // Assert
    expect(result).toBe("client-123.apps.example.com");
  });

  it("should throw a clear error when the client id is unset", () => {
    // Arrange
    vi.stubEnv("VITE_GOOGLE_OAUTH_CLIENT_ID", "");

    // Act
    const act = () => resolveGoogleOAuthClientId();

    // Assert
    expect(act).toThrow(/VITE_GOOGLE_OAUTH_CLIENT_ID/);
  });
});

describe("google oauth constants", () => {
  it("should target the non-sensitive appdata scope", () => {
    // Arrange

    // Act
    const scope = DRIVE_APPDATA_SCOPE;

    // Assert
    expect(scope).toBe("https://www.googleapis.com/auth/drive.appdata");
  });

  it("should point at the Google Identity Services client script", () => {
    // Arrange

    // Act
    const src = GIS_SCRIPT_SRC;

    // Assert
    expect(src).toBe("https://accounts.google.com/gsi/client");
  });
});
