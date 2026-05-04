import { describe, expect, it } from "vitest";
import { validatePathSecurity } from "./path-security";

describe("validatePathSecurity", () => {
  describe("valid paths", () => {
    it("should accept a simple filename", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("workout.fit")).not.toThrow();
    });

    it("should accept an absolute path", () => {
      // Arrange

      // Act

      // Assert
      expect(() =>
        validatePathSecurity("/home/user/workout.fit")
      ).not.toThrow();
    });

    it("should accept a relative path with ..", () => {
      // Arrange

      // Act

      // Assert
      expect(() =>
        validatePathSecurity("../other-folder/workout.fit")
      ).not.toThrow();
    });

    it("should accept a path with spaces", () => {
      // Arrange

      // Act

      // Assert
      expect(() =>
        validatePathSecurity("/home/user/my workouts/file.fit")
      ).not.toThrow();
    });

    it("should accept a Windows-style path", () => {
      // Arrange

      // Act

      // Assert
      expect(() =>
        validatePathSecurity("C:\\Users\\name\\workout.fit")
      ).not.toThrow();
    });

    it("should accept a path with dots", () => {
      // Arrange

      // Act

      // Assert
      expect(() =>
        validatePathSecurity("./data/v2.0/workout.fit")
      ).not.toThrow();
    });

    it("should accept a path with hyphens and underscores", () => {
      // Arrange

      // Act

      // Assert
      expect(() =>
        validatePathSecurity("/my-data/my_file-v2.fit")
      ).not.toThrow();
    });
  });

  describe("dangerous characters", () => {
    it("should reject null byte", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file\0.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject pipe character", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file|cat")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject semicolon", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file;rm -rf /")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject ampersand", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file&echo hacked")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject backtick", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file`whoami`")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject dollar sign", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file$(cat /etc/passwd)")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject parentheses", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file(test)")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject curly braces", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file{a,b}")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject exclamation mark", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file!.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject newline", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file\n.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject carriage return", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file\r.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject angle brackets", () => {
      // Arrange

      // Act

      // Assert
      expect(() => validatePathSecurity("file<input>")).toThrow(
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
