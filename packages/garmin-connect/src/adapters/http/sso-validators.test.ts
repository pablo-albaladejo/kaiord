import type { Logger } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { checkAccountLocked, checkPageTitle } from "./sso-validators";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("checkAccountLocked", () => {
  it("should throw when account is locked", () => {
    // Arrange

    // Act
    const html = 'var status = "ACCOUNT_LOCKED"';

    // Assert
    expect(() => checkAccountLocked(html)).toThrow("Account locked");
  });

  it("should not throw when status is not ACCOUNT_LOCKED", () => {
    // Arrange

    // Act
    const html = 'var status = "SUCCESS"';

    // Assert
    expect(() => checkAccountLocked(html)).not.toThrow();
  });

  it("should not throw when no status variable is present", () => {
    // Arrange

    // Act
    const html = "<html><body>no status</body></html>";

    // Assert
    expect(() => checkAccountLocked(html)).not.toThrow();
  });
});

describe("checkPageTitle", () => {
  it("should throw when title contains Update Phone Number", () => {
    // Arrange

    // Act
    const html = "<title>Update Phone Number</title>";

    // Assert
    expect(() => checkPageTitle(html, mockLogger)).toThrow(
      "phone number update required"
    );
  });

  it("should log page title when present and not phone number update", () => {
    // Arrange
    const html = "<title>GARMIN SSO</title>";

    // Act
    checkPageTitle(html, mockLogger);

    // Assert
    expect(mockLogger.debug).toHaveBeenCalledWith("Login page title", {
      title: "GARMIN SSO",
    });
  });

  it("should not throw or log when no title tag is present", () => {
    // Arrange

    // Act
    const html = "<html><body>no title</body></html>";

    // Assert
    expect(() => checkPageTitle(html, mockLogger)).not.toThrow();
  });
});
