import { describe, expect, it } from "vitest";

import { managedSettingsPaths } from "./managed-settings";

/** Linux checks two paths, macOS three; the unknown platform none. */
const PATHS_CHECKED = 5;

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
      managedSettingsPaths("linux", exists),
      managedSettingsPaths("darwin", exists),
      managedSettingsPaths("aix", exists),
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
});
