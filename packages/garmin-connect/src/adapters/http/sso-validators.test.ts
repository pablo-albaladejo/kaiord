import { describe, it, expect, vi } from "vitest";
import { checkAccountLocked, checkPageTitle } from "./sso-validators";
import type { Logger } from "@kaiord/core";

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("checkAccountLocked", () => {
  it("should throw when account is locked", () => {
    const html = 'var status = "ACCOUNT_LOCKED"';

    expect(() => checkAccountLocked(html)).toThrow("Account locked");
  });

  it("should not throw when status is not ACCOUNT_LOCKED", () => {
    const html = 'var status = "SUCCESS"';

    expect(() => checkAccountLocked(html)).not.toThrow();
  });

  it("should not throw when no status variable is present", () => {
    const html = "<html><body>no status</body></html>";

    expect(() => checkAccountLocked(html)).not.toThrow();
  });
});

describe("checkPageTitle", () => {
  it("should throw when title contains Update Phone Number", () => {
    const html = "<title>Update Phone Number</title>";

    expect(() => checkPageTitle(html, mockLogger)).toThrow(
      "phone number update required"
    );
  });

  it("should log page title when present and not phone number update", () => {
    const html = "<title>GARMIN SSO</title>";

    checkPageTitle(html, mockLogger);

    expect(mockLogger.debug).toHaveBeenCalledWith("Login page title", {
      title: "GARMIN SSO",
    });
  });

  it("should not throw or log when no title tag is present", () => {
    const html = "<html><body>no title</body></html>";

    expect(() => checkPageTitle(html, mockLogger)).not.toThrow();
  });
});
