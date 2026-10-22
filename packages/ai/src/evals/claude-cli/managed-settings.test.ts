import { describe, expect, it } from "vitest";

import { managedSettingsFile } from "./managed-settings";

describe("managedSettingsFile", () => {
  it("should report the platform's file only when it exists, without reading it", () => {
    // Arrange
    const checked: Array<string> = [];
    const exists = (path: string) => {
      checked.push(path);
      return path.startsWith("/etc/");
    };

    // Act
    const found = [
      managedSettingsFile("linux", exists),
      managedSettingsFile("darwin", exists),
      managedSettingsFile("aix", exists),
    ];

    // Assert
    expect(found).toEqual([
      "/etc/claude-code/managed-settings.json",
      null,
      null,
    ]);
    expect(checked).toHaveLength(2);
  });
});
