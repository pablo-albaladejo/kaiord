import "vitest";

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  type Assertion<T = unknown> = {} & jest.Matchers<void> &
    TestingLibraryMatchers<T, void>;
}
