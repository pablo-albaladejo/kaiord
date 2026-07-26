import { afterEach, describe, expect, it } from "vitest";

import {
  getUmamiWebsiteId,
  UMAMI_WEBSITE_ID_PLACEHOLDER,
} from "./runtime-config";

type WindowWithConfig = Window &
  typeof globalThis & {
    __KAIORD_CONFIG__?: { umamiWebsiteId?: string };
  };

describe("getUmamiWebsiteId", () => {
  afterEach(() => {
    delete (window as WindowWithConfig).__KAIORD_CONFIG__;
  });

  it("should return undefined when window.__KAIORD_CONFIG__ is unset", () => {
    // Arrange
    delete (window as WindowWithConfig).__KAIORD_CONFIG__;

    // Act
    const websiteId = getUmamiWebsiteId();

    // Assert
    expect(websiteId).toBeUndefined();
  });

  it("should return undefined when umamiWebsiteId is empty string", () => {
    // Arrange
    (window as WindowWithConfig).__KAIORD_CONFIG__ = { umamiWebsiteId: "" };

    // Act
    const websiteId = getUmamiWebsiteId();

    // Assert
    expect(websiteId).toBeUndefined();
  });

  it("should return undefined when the un-substituted placeholder is present", () => {
    // Arrange
    (window as WindowWithConfig).__KAIORD_CONFIG__ = {
      umamiWebsiteId: UMAMI_WEBSITE_ID_PLACEHOLDER,
    };

    // Act
    const websiteId = getUmamiWebsiteId();

    // Assert
    expect(websiteId).toBeUndefined();
  });

  it("should return the real website id when deploy-time substitution has run", () => {
    // Arrange
    (window as WindowWithConfig).__KAIORD_CONFIG__ = {
      umamiWebsiteId: "a5b4bf9b-real-website-id",
    };

    // Act
    const websiteId = getUmamiWebsiteId();

    // Assert
    expect(websiteId).toBe("a5b4bf9b-real-website-id");
  });
});
