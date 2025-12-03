/**
 * Tests for Console Spy Utility
 *
 * Validates that the console spy correctly detects React warnings.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanupConsoleErrorSpy,
  expectNoConsoleErrors,
  expectNoReactPropWarnings,
  expectNoReactWarnings,
  setupConsoleErrorSpy,
} from "./console-spy";

describe("console-spy utilities", () => {
  describe("expectNoReactWarnings", () => {
    it("should pass when no React warnings are logged", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act - No warnings logged

      // Assert
      expect(() => warningChecker.verify()).not.toThrow();
    });

    it("should fail when React prop warning is logged", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act - Simulate React warning
      console.error(
        "Warning: React does not recognize the `onStepSelect` prop on a DOM element."
      );

      // Assert
      expect(() => warningChecker.verify()).toThrow();
    });

    it("should pass when non-React errors are logged", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act - Log non-React error
      console.error("Some other error");

      // Assert
      expect(() => warningChecker.verify()).not.toThrow();
    });

    it("should detect multiple React warnings", () => {
      // Arrange
      const warningChecker = expectNoReactWarnings();

      // Act - Simulate multiple React warnings
      console.error(
        "Warning: React does not recognize the `onStepSelect` prop on a DOM element."
      );
      console.error(
        "Warning: React does not recognize the `selectedStepId` prop on a DOM element."
      );

      // Assert
      expect(() => warningChecker.verify()).toThrow(
        /Found 2 React prop warning/
      );
    });
  });

  describe("setupConsoleErrorSpy and cleanupConsoleErrorSpy", () => {
    let consoleSpy: ReturnType<typeof setupConsoleErrorSpy>;

    beforeEach(() => {
      consoleSpy = setupConsoleErrorSpy();
    });

    afterEach(() => {
      cleanupConsoleErrorSpy(consoleSpy);
    });

    it("should spy on console.error", () => {
      // Act
      console.error("test error");

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith("test error");
    });

    it("should cleanup console spy without errors", () => {
      // Arrange
      console.error("test");

      // Act & Assert - Should not throw
      expect(() => cleanupConsoleErrorSpy(consoleSpy)).not.toThrow();
    });
  });

  describe("expectNoConsoleErrors", () => {
    let consoleSpy: ReturnType<typeof setupConsoleErrorSpy>;

    beforeEach(() => {
      consoleSpy = setupConsoleErrorSpy();
    });

    afterEach(() => {
      cleanupConsoleErrorSpy(consoleSpy);
    });

    it("should pass when no errors are logged", () => {
      // Act & Assert
      expect(() => expectNoConsoleErrors(consoleSpy)).not.toThrow();
    });

    it("should fail when errors are logged", () => {
      // Arrange
      console.error("test error");

      // Act & Assert
      expect(() => expectNoConsoleErrors(consoleSpy)).toThrow();
    });
  });

  describe("expectNoReactPropWarnings", () => {
    let consoleSpy: ReturnType<typeof setupConsoleErrorSpy>;

    beforeEach(() => {
      consoleSpy = setupConsoleErrorSpy();
    });

    afterEach(() => {
      cleanupConsoleErrorSpy(consoleSpy);
    });

    it("should pass when no React warnings are logged", () => {
      // Act & Assert
      expect(() => expectNoReactPropWarnings(consoleSpy)).not.toThrow();
    });

    it("should fail when React prop warning is logged", () => {
      // Arrange
      console.error(
        "Warning: React does not recognize the `onStepSelect` prop on a DOM element."
      );

      // Act & Assert
      expect(() => expectNoReactPropWarnings(consoleSpy)).toThrow();
    });

    it("should pass when non-React errors are logged", () => {
      // Arrange
      console.error("Some other error");

      // Act & Assert
      expect(() => expectNoReactPropWarnings(consoleSpy)).not.toThrow();
    });

    it("should detect specific prop warnings when prop names provided", () => {
      // Arrange
      console.error(
        "Warning: React does not recognize the `onStepSelect` prop on a DOM element."
      );
      console.error(
        "Warning: React does not recognize the `otherProp` prop on a DOM element."
      );

      // Act & Assert - Should fail because onStepSelect is in the list
      expect(() =>
        expectNoReactPropWarnings(consoleSpy, ["onStepSelect"])
      ).toThrow();
    });

    it("should pass when specific prop warnings are not present", () => {
      // Arrange
      console.error(
        "Warning: React does not recognize the `otherProp` prop on a DOM element."
      );

      // Act & Assert - Should pass because onStepSelect is not in the warning
      expect(() =>
        expectNoReactPropWarnings(consoleSpy, ["onStepSelect"])
      ).not.toThrow();
    });

    it("should detect warnings for any prop in the list", () => {
      // Arrange
      console.error(
        "Warning: React does not recognize the `selectedStepId` prop on a DOM element."
      );

      // Act & Assert - Should fail because selectedStepId is in the list
      expect(() =>
        expectNoReactPropWarnings(consoleSpy, [
          "onStepSelect",
          "selectedStepId",
        ])
      ).toThrow();
    });
  });
});
