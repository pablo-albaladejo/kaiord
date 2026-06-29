import { describe, expect, it } from "vitest";

import { validatePathSecurity } from "./path-security";

describe("validatePathSecurity", () => {
  describe("valid paths", () => {
    it.each([
      "workout.fit",
      "/home/user/workout.fit",
      "../other-folder/workout.fit",
      "/home/user/my workouts/file.fit",
      "C:\\Users\\name\\workout.fit",
      "./data/v2.0/workout.fit",
      "/my-data/my_file-v2.fit",
    ])("should accept %j as a valid path", (goodPath) => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity(goodPath)).not.toThrow();
    });
  });

  describe("dangerous characters", () => {
    it.each([
      "file\0.fit",
      "file|cat",
      "file;rm -rf /",
      "file&echo hacked",
      "file`whoami`",
      "file$(cat /etc/passwd)",
      "file(test)",
      "file{a,b}",
      "file!.fit",
      "file\n.fit",
      "file\r.fit",
      "file<input>",
    ])("should reject %j as a path with dangerous characters", (badPath) => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity(badPath)).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });
  });

  describe("error message", () => {
    it("should include the offending path in the error message", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("bad;path")).toThrow("bad;path");
    });
  });
});
