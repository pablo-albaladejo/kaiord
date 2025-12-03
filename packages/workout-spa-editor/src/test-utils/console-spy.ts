/**
 * Console Spy Utility for Detecting React Warnings
 *
 * Provides utilities to detect and verify React warnings during tests,
 * particularly "React does not recognize" prop warnings.
 */

import { expect, vi } from "vitest";

type ConsoleSpy = ReturnType<typeof vi.spyOn>;

/**
 * Creates a console spy that can detect React warnings
 *
 * @returns Object with verify method to check for React warnings
 *
 * @example
 * ```typescript
 * it("should render without React warnings", () => {
 *   const warningChecker = expectNoReactWarnings();
 *
 *   render(<MyComponent {...props} />);
 *
 *   warningChecker.verify();
 * });
 * ```
 */
export const expectNoReactWarnings = () => {
  const consoleSpy = vi.spyOn(console, "error");

  return {
    /**
     * Verifies that no React prop warnings were logged
     * Throws an assertion error if warnings are found
     */
    verify: () => {
      const reactWarnings = consoleSpy.mock.calls.filter(([message]) => {
        return (
          typeof message === "string" &&
          message.includes("React does not recognize")
        );
      });

      if (reactWarnings.length > 0) {
        const warningMessages = reactWarnings
          .map(([msg]) => `  - ${msg}`)
          .join("\n");
        expect.fail(
          `Found ${reactWarnings.length} React prop warning(s):\n${warningMessages}`
        );
      }

      expect(reactWarnings).toHaveLength(0);
      consoleSpy.mockRestore();
    },
  };
};

/**
 * Setup function to spy on console.error before each test
 * Use in describe blocks that need to check for warnings
 *
 * @returns Console spy instance
 *
 * @example
 * ```typescript
 * describe("MyComponent", () => {
 *   let consoleSpy: ReturnType<typeof setupConsoleErrorSpy>;
 *
 *   beforeEach(() => {
 *     consoleSpy = setupConsoleErrorSpy();
 *   });
 *
 *   afterEach(() => {
 *     cleanupConsoleErrorSpy(consoleSpy);
 *   });
 *
 *   it("should not log warnings", () => {
 *     render(<MyComponent />);
 *     expectNoConsoleErrors(consoleSpy);
 *   });
 * });
 * ```
 */
export const setupConsoleErrorSpy = (): ConsoleSpy => {
  return vi.spyOn(console, "error");
};

/**
 * Cleanup function to restore console.error after tests
 *
 * @param consoleSpy - The spy instance to cleanup
 */
export const cleanupConsoleErrorSpy = (consoleSpy: ConsoleSpy): void => {
  consoleSpy.mockRestore();
};

/**
 * Expects that no console errors were logged during the test
 *
 * @param consoleSpy - The spy instance to check
 */
export const expectNoConsoleErrors = (consoleSpy: ConsoleSpy): void => {
  expect(consoleSpy).not.toHaveBeenCalled();
};

/**
 * Expects that specific React prop warnings were NOT logged
 *
 * @param consoleSpy - The spy instance to check
 * @param propNames - Array of prop names to check for
 *
 * @example
 * ```typescript
 * expectNoReactPropWarnings(consoleSpy, ["onStepSelect", "selectedStepId"]);
 * ```
 */
export const expectNoReactPropWarnings = (
  consoleSpy: ConsoleSpy,
  propNames?: string[]
): void => {
  const reactWarnings = consoleSpy.mock.calls.filter(([message]) => {
    if (typeof message !== "string") return false;
    if (!message.includes("React does not recognize")) return false;

    // If specific prop names provided, check if any match
    if (propNames && propNames.length > 0) {
      return propNames.some((propName) => message.includes(propName));
    }

    return true;
  });

  if (reactWarnings.length > 0) {
    const warningMessages = reactWarnings
      .map(([msg]) => `  - ${msg}`)
      .join("\n");
    expect.fail(
      `Found ${reactWarnings.length} React prop warning(s):\n${warningMessages}`
    );
  }

  expect(reactWarnings).toHaveLength(0);
};
