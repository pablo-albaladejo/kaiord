import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import "vitest";

declare module "vitest" {
  interface Assertion<T = unknown>
    extends jest.Matchers<void>,
      TestingLibraryMatchers<T, void> {}
}
