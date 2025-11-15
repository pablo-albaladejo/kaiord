import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import "vitest";

declare module "vitest" {
  type Assertion<T = unknown> = {} & jest.Matchers<void> & TestingLibraryMatchers<T, void>
}
