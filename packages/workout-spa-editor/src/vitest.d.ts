import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import "vitest";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Assertion<T = unknown>
    extends jest.Matchers<void>,
      TestingLibraryMatchers<T, void> {}
}
