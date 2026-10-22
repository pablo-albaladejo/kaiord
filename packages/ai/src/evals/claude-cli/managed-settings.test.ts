import { describe, expect, it } from "vitest";

import { managedSettingsPaths } from "./managed-settings";

/** Linux checks two paths, macOS four (one per user); the unknown none. */
const PATHS_CHECKED = 6;

describe("managedSettingsPaths", () => {
  it("should report the file and the drop-in directory that exist, without reading them", () => {
    // Arrange
    const checked: Array<string> = [];
    const exists = (path: string) => {
      checked.push(path);
      return (
        path.startsWith("/etc/") ||
        path.endsWith("ClaudeCode/managed-settings.d")
      );
    };

    // Act
    const found = [
      managedSettingsPaths("linux", exists, "someone"),
      managedSettingsPaths("darwin", exists, "someone"),
      managedSettingsPaths("aix", exists, "someone"),
    ];

    // Assert
    expect(found).toEqual([
      [
        "/etc/claude-code/managed-settings.json",
        "/etc/claude-code/managed-settings.d",
      ],
      ["/Library/Application Support/ClaudeCode/managed-settings.d"],
      [],
    ]);
    expect(checked).toHaveLength(PATHS_CHECKED);
  });

  it("should probe the macOS MDM managed-preferences plist by existence", () => {
    // Arrange
    const plist = "/Library/Managed Preferences/com.anthropic.claudecode.plist";
    const exists = (path: string) => path === plist;

    // Act
    const found = managedSettingsPaths("darwin", exists);

    // Assert
    expect(found).toEqual([plist]);
  });

  it("should probe the per-user managed-preferences plist by existence", () => {
    // Arrange
    const plist =
      "/Library/Managed Preferences/someone/com.anthropic.claudecode.plist";
    const exists = (path: string) => path === plist;

    // Act
    const found = [
      managedSettingsPaths("darwin", exists, "someone"),
      managedSettingsPaths("darwin", exists, undefined),
      managedSettingsPaths("linux", exists, "someone"),
    ];

    // Assert
    expect(found).toEqual([[plist], [], []]);
  });
});
