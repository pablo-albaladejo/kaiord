import { describe, expect, it } from "vitest";

import { managedSettingsPaths } from "./managed-settings";

/** Two known platforms, two paths each; the unknown one checks none. */
const PATHS_CHECKED = 4;

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
});
