import { describe, expect, it } from "vitest";
import { validatePathSecurity } from "./path-security";

describe("validatePathSecurity", () => {
  describe("valid paths", () => {
    it("should accept a simple filename", () => {
      expect(() => validatePathSecurity("workout.fit")).not.toThrow();
    });

    it("should accept an absolute path", () => {
      expect(() =>
        validatePathSecurity("/home/user/workout.fit")
      ).not.toThrow();
    });

    it("should accept a relative path with ..", () => {
      expect(() =>
        validatePathSecurity("../other-folder/workout.fit")
      ).not.toThrow();
    });

    it("should accept a path with spaces", () => {
      expect(() =>
        validatePathSecurity("/home/user/my workouts/file.fit")
      ).not.toThrow();
    });

    it("should accept a Windows-style path", () => {
      expect(() =>
        validatePathSecurity("C:\\Users\\name\\workout.fit")
      ).not.toThrow();
    });

    it("should accept a path with dots", () => {
      expect(() =>
        validatePathSecurity("./data/v2.0/workout.fit")
      ).not.toThrow();
    });

    it("should accept a path with hyphens and underscores", () => {
      expect(() =>
        validatePathSecurity("/my-data/my_file-v2.fit")
      ).not.toThrow();
    });
  });

  describe("dangerous characters", () => {
    it("should reject null byte", () => {
      expect(() => validatePathSecurity("file\0.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject pipe character", () => {
      expect(() => validatePathSecurity("file|cat")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject semicolon", () => {
      expect(() => validatePathSecurity("file;rm -rf /")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject ampersand", () => {
      expect(() => validatePathSecurity("file&echo hacked")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject backtick", () => {
      expect(() => validatePathSecurity("file`whoami`")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject dollar sign", () => {
      expect(() => validatePathSecurity("file$(cat /etc/passwd)")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject parentheses", () => {
      expect(() => validatePathSecurity("file(test)")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject curly braces", () => {
      expect(() => validatePathSecurity("file{a,b}")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject exclamation mark", () => {
      expect(() => validatePathSecurity("file!.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject newline", () => {
      expect(() => validatePathSecurity("file\n.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject carriage return", () => {
      expect(() => validatePathSecurity("file\r.fit")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });

    it("should reject angle brackets", () => {
      expect(() => validatePathSecurity("file<input>")).toThrow(
        "Invalid path: dangerous characters detected"
      );
    });
  });

  describe("error message", () => {
    it("should include the offending path in the error message", () => {
      expect(() => validatePathSecurity("bad;path")).toThrow("bad;path");
    });
  });
});
