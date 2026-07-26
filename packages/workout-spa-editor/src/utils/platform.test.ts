import { afterEach, describe, expect, it, vi } from "vitest";

import { formatShortcutKeys, isMacPlatform } from "./platform";

const stubNavigator = (value: Partial<Navigator>) => {
  vi.stubGlobal("navigator", value);
};

describe("isMacPlatform", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    {
      label: "userAgentData reports macOS",
      nav: { userAgentData: { platform: "macOS" } },
      expected: true,
    },
    {
      label: "userAgentData reports Windows",
      nav: { userAgentData: { platform: "Windows" } },
      expected: false,
    },
    {
      label: "user agent mentions Macintosh",
      nav: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      expected: true,
    },
    {
      label: "user agent mentions Windows",
      nav: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      expected: false,
    },
  ])("should return $expected when $label", ({ nav, expected }) => {
    // Arrange
    stubNavigator(nav as Partial<Navigator>);

    // Act
    const result = isMacPlatform();

    // Assert
    expect(result).toBe(expected);
  });

  it("should prefer userAgentData over the user agent string", () => {
    // Arrange
    stubNavigator({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      userAgentData: { platform: "Windows" },
    } as Partial<Navigator>);

    // Act
    const result = isMacPlatform();

    // Assert
    expect(result).toBe(false);
  });

  it("should never read the deprecated navigator.platform", () => {
    // Arrange
    const platform = vi.fn(() => "MacIntel");
    stubNavigator({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      get platform() {
        return platform();
      },
    } as Partial<Navigator>);

    // Act
    isMacPlatform();

    // Assert
    expect(platform).not.toHaveBeenCalled();
  });
});

describe("formatShortcutKeys", () => {
  it("should return the mac keys on a mac when they are defined", () => {
    // Arrange
    const def = { keys: ["Ctrl", "S"], macKeys: ["⌘", "S"] };

    // Act
    const result = formatShortcutKeys(def, true);

    // Assert
    expect(result).toEqual(["⌘", "S"]);
  });

  it("should fall back to the default keys on a mac without mac keys", () => {
    // Arrange
    const def = { keys: ["Esc"] };

    // Act
    const result = formatShortcutKeys(def, true);

    // Assert
    expect(result).toEqual(["Esc"]);
  });

  it("should return the default keys off a mac", () => {
    // Arrange
    const def = { keys: ["Ctrl", "S"], macKeys: ["⌘", "S"] };

    // Act
    const result = formatShortcutKeys(def, false);

    // Assert
    expect(result).toEqual(["Ctrl", "S"]);
  });
});
