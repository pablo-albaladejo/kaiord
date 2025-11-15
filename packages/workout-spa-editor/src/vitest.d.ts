import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import "vitest";

declare module "vitest" {
<<<<<<< HEAD
  type Assertion<T = unknown> = {} & jest.Matchers<void> &
    TestingLibraryMatchers<T, void>;
=======
  interface Assertion<T = unknown>
    extends jest.Matchers<void>,
      TestingLibraryMatchers<T, void> {}
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
}
