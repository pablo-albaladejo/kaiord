import { afterEach, describe, expect, it } from "vitest";

import {
  CF_ANALYTICS_TOKEN_PLACEHOLDER,
  getCfAnalyticsToken,
} from "./runtime-config";

type WindowWithConfig = Window &
  typeof globalThis & {
    __KAIORD_CONFIG__?: { cfAnalyticsToken?: string };
  };

describe("getCfAnalyticsToken", () => {
  afterEach(() => {
    delete (window as WindowWithConfig).__KAIORD_CONFIG__;
  });

  it("should return undefined when window.__KAIORD_CONFIG__ is unset", () => {
    // Arrange
    delete (window as WindowWithConfig).__KAIORD_CONFIG__;

    // Act
    const token = getCfAnalyticsToken();

    // Assert
    expect(token).toBeUndefined();
  });

  it("should return undefined when cfAnalyticsToken is empty string", () => {
    // Arrange
    (window as WindowWithConfig).__KAIORD_CONFIG__ = { cfAnalyticsToken: "" };

    // Act
    const token = getCfAnalyticsToken();

    // Assert
    expect(token).toBeUndefined();
  });

  it("should return undefined when the un-substituted placeholder is present", () => {
    // Arrange
    (window as WindowWithConfig).__KAIORD_CONFIG__ = {
      cfAnalyticsToken: CF_ANALYTICS_TOKEN_PLACEHOLDER,
    };

    // Act
    const token = getCfAnalyticsToken();

    // Assert
    expect(token).toBeUndefined();
  });

  it("should return the real token when deploy-time substitution has run", () => {
    // Arrange
    (window as WindowWithConfig).__KAIORD_CONFIG__ = {
      cfAnalyticsToken: "abc123-real-token",
    };

    // Act
    const token = getCfAnalyticsToken();

    // Assert
    expect(token).toBe("abc123-real-token");
  });
});
